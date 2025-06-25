// app/admin/laporan/page.jsx
"use client";

import { useState, useEffect } from "react";
import { databases } from "@/app/lib/appwrite";
import { Query } from "appwrite";
import Link from "next/link";
import Papa from "papaparse";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const IURAN_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_IURAN_COLLECTION_ID;
const WARGA_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_WARGA_COLLECTION_ID;

// Komponen Kartu Statistik untuk Laporan
const ReportCard = ({ title, value, color }) => (
    <div className={`p-4 rounded-lg shadow-md ${color}`}>
        <p className="text-sm font-medium text-white opacity-90">{title}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
    </div>
);

export default function LaporanPage() {
    const [wargaMap, setWargaMap] = useState(new Map());
    const [filters, setFilters] = useState({ year: new Date().getFullYear(), month: new Date().getMonth() + 1 });
    const [report, setReport] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const [showEditModal, setShowEditModal] = useState(false);
    const [editingIuran, setEditingIuran] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Ambil data semua warga sekali saja untuk mapping ID ke Nama
    useEffect(() => {
        const fetchAllWarga = async () => {
            try {
                const response = await databases.listDocuments(DATABASE_ID, WARGA_COLLECTION_ID, [Query.limit(5000)]);
                const wargaDataMap = new Map(response.documents.map(w => [w.$id, w.nama]));
                setWargaMap(wargaDataMap);
            } catch (error) {
                console.error("Gagal mengambil data warga:", error);
            }
        };
        fetchAllWarga();
    }, []);

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const generateReport = async () => {
        setIsLoading(true);
        setReport(null); // Reset laporan sebelumnya
        const periode = `${filters.year}-${String(filters.month).padStart(2, '0')}`;

        try {
            const response = await databases.listDocuments(DATABASE_ID, IURAN_COLLECTION_ID, [
                Query.equal('periode', periode),
                Query.limit(5000)
            ]);

            const iuranBulanIni = response.documents;
            const lunas = iuranBulanIni.filter(i => i.status === 'LUNAS');
            const belumLunas = iuranBulanIni.filter(i => i.status !== 'LUNAS');

            const totalPemasukan = iuranBulanIni.reduce((sum, i) => sum + i.jumlah, 0);
            const sudahTerbayar = lunas.reduce((sum, i) => sum + i.jumlah, 0);

            setReport({
                totalTagihan: iuranBulanIni.length,
                totalPemasukan: totalPemasukan,
                sudahTerbayar: sudahTerbayar,
                tunggakan: totalPemasukan - sudahTerbayar,
                persentaseLunas: totalPemasukan > 0 ? (sudahTerbayar / totalPemasukan) * 100 : 0,
                dataBelumLunas: belumLunas,
            });

        } catch (error) {
            console.error("Gagal membuat laporan:", error);
            alert("Gagal membuat laporan.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleExportCSV = () => {
        if (!report || report.dataBelumLunas.length === 0) {
            alert("Tidak ada data tunggakan untuk diekspor.");
            return;
        }

        // 1. Siapkan data dengan format yang diinginkan (tambahkan nama warga)
        const dataForExport = report.dataBelumLunas.map((iuran, index) => ({
            "No.": index + 1,
            "Nama Warga": wargaMap.get(iuran.wargaId) || 'Nama tidak ditemukan',
            "Periode": iuran.periode,
            "Jumlah Tunggakan": iuran.jumlah,
            "Status": iuran.status
        }));

        // 2. Ubah data JSON menjadi string CSV
        const csv = Papa.unparse(dataForExport);

        // 3. Buat file dan trigger download di browser
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            const periode = `${filters.year}-${String(filters.month).padStart(2, '0')}`;
            link.setAttribute("href", url);
            link.setAttribute("download", `laporan-tunggakan-${periode}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };
    // ------------------------------------
    const handleOpenEditModal = (iuran) => {
        setEditingIuran(iuran);
        setShowEditModal(true);
    };

    const handleCloseEditModal = () => {
        setEditingIuran(null);
        setShowEditModal(false);
    };

    const handleEditFormChange = (e) => {
        const { name, value } = e.target;
        setEditingIuran(prev => ({ ...prev, [name]: name === 'jumlah' ? parseInt(value) || 0 : value }));
    };

    const handleUpdateIuran = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await databases.updateDocument(
                DATABASE_ID,
                IURAN_COLLECTION_ID,
                editingIuran.$id,
                {
                    jumlah: editingIuran.jumlah,
                    status: editingIuran.status
                }
            );
            alert("Data iuran berhasil diperbarui!");
            handleCloseEditModal();
            generateReport(); // Generate ulang laporan untuk melihat data terbaru
        } catch (error) {
            console.error("Gagal update iuran:", error);
            alert(`Gagal update: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const yearOptions = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

    return (
        <>
            <main className="min-h-screen bg-gray-100 p-4 sm:p-8">
                <div className="w-full max-w-6xl mx-auto">
                    <div className="mb-6">
                        <Link href="/admin/dashboard" className="text-blue-500 hover:underline">← Kembali ke Dasbor Admin</Link>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Laporan Keuangan Iuran</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            <div>
                                <label className="block text-sm font-medium">Tahun</label>
                                <select name="year" value={filters.year} onChange={handleFilterChange} className="mt-1 p-2 w-full border rounded">
                                    {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Bulan</label>
                                <select name="month" value={filters.month} onChange={handleFilterChange} className="mt-1 p-2 w-full border rounded">
                                    {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('id-ID', { month: 'long' })}</option>)}
                                </select>
                            </div>
                            <button onClick={generateReport} disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-5 rounded-lg transition-colors disabled:bg-gray-400">
                                {isLoading ? 'Memuat...' : 'Tampilkan Laporan'}
                            </button>
                        </div>
                    </div>

                    {report && (
                        <div className="space-y-8">
                            {/* Ringkasan Statistik */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <ReportCard title="Total Tagihan" value={report.totalTagihan} color="bg-blue-500" />
                                <ReportCard title="Sudah Terbayar" value={`Rp ${report.sudahTerbayar.toLocaleString('id-ID')}`} color="bg-green-500" />
                                <ReportCard title="Tunggakan" value={`Rp ${report.tunggakan.toLocaleString('id-ID')}`} color="bg-red-500" />
                                <ReportCard title="Persentase Lunas" value={`${report.persentaseLunas.toFixed(1)}%`} color="bg-yellow-500" />
                            </div>

                            {/* Daftar Warga Belum Bayar */}
                            <div className="bg-white p-6 rounded-lg shadow-md">
                                <h3 className="text-xl font-semibold text-gray-700 mb-4">Daftar Warga yang Belum Bayar</h3>
                                <button
                                    onClick={handleExportCSV}
                                    disabled={report.dataBelumLunas.length === 0}
                                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    Export ke CSV
                                </button>
                                <div className="overflow-x-auto border rounded-lg">
                                    <table className="min-w-full bg-white">
                                        <thead className="bg-gray-200">
                                            <tr>
                                                <th className="py-2 px-4 text-left">Nama Warga</th>
                                                <th className="py-2 px-4 text-left">Jumlah</th>
                                                <th className="py-2 px-4 text-left">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {report.dataBelumLunas.length > 0 ? report.dataBelumLunas.map(iuran => (
                                                <tr key={iuran.$id}>
                                                    <td className="py-2 px-4 border-t">{wargaMap.get(iuran.wargaId) || 'Nama tidak ditemukan'}</td>
                                                    <td className="py-2 px-4 border-t">Rp {iuran.jumlah.toLocaleString('id-ID')}</td>
                                                    <td className="py-2 px-4 border-t">{iuran.status}</td>
                                                    <td className="py-2 px-4 border-t text-center">
                                                        <button onClick={() => handleOpenEditModal(iuran)} className="bg-yellow-500 text-white text-xs font-bold py-1 px-2 rounded">Edit</button>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr><td colSpan="3" className="text-center py-4">Semua warga sudah bayar. Mantap!</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
            {/* MODAL EDIT IURAN */}
            {showEditModal && editingIuran && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Edit Iuran: {wargaMap.get(editingIuran.wargaId)}</h2>
                        <p className="text-sm text-gray-500 mb-4">Periode: {editingIuran.periode}</p>
                        <form onSubmit={handleUpdateIuran} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium">Jumlah (Rp)</label>
                                <input type="number" name="jumlah" value={editingIuran.jumlah} onChange={handleEditFormChange} required className="p-2 border rounded w-full" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Status</label>
                                <select name="status" value={editingIuran.status} onChange={handleEditFormChange} className="p-2 border rounded w-full">
                                    <option value="BELUM_LUNAS">BELUM LUNAS</option>
                                    <option value="MENUNGGU_VALIDASI">MENUNGGU VALIDASI</option>
                                    <option value="LUNAS">LUNAS</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-4 mt-6">
                                <button type="button" onClick={handleCloseEditModal} className="px-4 py-2 bg-gray-200 rounded">Batal</button>
                                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400">
                                    {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}