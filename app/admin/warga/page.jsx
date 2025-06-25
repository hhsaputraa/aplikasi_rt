// app/admin/warga/page.jsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { databases, functions } from "@/app/lib/appwrite";
import Link from "next/link";
import { Query } from "appwrite";
import toast from "react-hot-toast";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const WARGA_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_WARGA_COLLECTION_ID;
const CREATE_FUNCTION_ID = process.env.NEXT_PUBLIC_APPWRITE_FUNCTION_ID;
const UPDATE_FUNCTION_ID = process.env.NEXT_PUBLIC_APPWRITE_UPDATE_WARGA_FUNCTION_ID;
const DELETE_FUNCTION_ID = process.env.NEXT_PUBLIC_APPWRITE_DELETE_WARGA_FUNCTION_ID;
const FUNCTION_ID = process.env.NEXT_PUBLIC_APPWRITE_FUNCTION_ID;

export default function WargaManagementPage() {
    const [wargaList, setWargaList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // State untuk form tambah warga
    const [formState, setFormState] = useState({ nama: '', nomorRumah: '', email: '', password: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const [showEditModal, setShowEditModal] = useState(false);
    const [editingWarga, setEditingWarga] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalWarga, setTotalWarga] = useState(0);
    const itemsPerPage = 10;
    const [allWarga, setAllWarga] = useState([]);

    const fetchAllWarga = async () => {
        setIsLoading(true);
        try {
            // Ambil semua data warga (maksimal 5000, batas Appwrite)
            const response = await databases.listDocuments(
                DATABASE_ID,
                WARGA_COLLECTION_ID,
                [Query.limit(5000), Query.orderDesc('$createdAt')]
            );
            setAllWarga(response.documents);
        } catch (error) {
            console.error("Gagal mengambil daftar warga:", error);
            setError("Gagal memuat daftar warga.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAllWarga();
    }, []);

    const filteredWarga = useMemo(() => {
        if (!searchQuery) {
            return allWarga; // Jika tidak ada query, tampilkan semua
        }
        return allWarga.filter(warga =>
            warga.nama.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [allWarga, searchQuery]);

    const handleInputChange = (e) => { setFormState({ ...formState, [e.target.name]: e.target.value }); };

    const handleSearch = (e) => {
        e.preventDefault();
        setCurrentPage(1);
        fetchAllWarga();
    };

    // --- FUNGSI YANG DIPERBAIKI ---
    const handleAddWarga = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        if (!formState.nama || !formState.email || !formState.password || !formState.nomorRumah) {
            setError("Semua field wajib diisi.");
            setIsSubmitting(false);
            return;
        }

        try {
            const payload = JSON.stringify(formState);
            const response = await functions.createExecution(FUNCTION_ID, payload);

            const responseBody = JSON.parse(response.responseBody);
            if (responseBody.success) {
                toast.success('Warga baru berhasil ditambahkan!');
                setFormState({ nama: '', nomorRumah: '', email: '', password: '' });
                fetchAllWarga();
            } else {
                throw new Error(responseBody.message);
            }

        } catch (err) {
            toast.error(err.message || "Terjadi kesalahan.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenEditModal = (warga) => {
        setEditingWarga(warga);
        setShowEditModal(true);
    };

    const handleCloseEditModal = () => {
        setEditingWarga(null);
        setShowEditModal(false);
    };

    const handleUpdateWarga = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = JSON.stringify({
                docId: editingWarga.$id,
                authId: editingWarga.userId,
                nama: editingWarga.nama,
                nomorRumah: editingWarga.nomorRumah
            });
            const response = await functions.createExecution(UPDATE_FUNCTION_ID, payload);
            const responseBody = JSON.parse(response.responseBody);

            if (responseBody.success) {
                alert('Data warga berhasil diupdate!');
                handleCloseEditModal();
                fetchWarga();
            } else { throw new Error(responseBody.message); }
        } catch (err) {
            alert(`Error: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteWarga = async (warga) => {
        if (!confirm(`Anda yakin ingin menghapus ${warga.nama}? Tindakan ini akan menghapus akun login dan semua datanya secara permanen.`)) return;

        try {
            const payload = JSON.stringify({ docId: warga.$id, authId: warga.userId });
            const response = await functions.createExecution(DELETE_FUNCTION_ID, payload);
            const responseBody = JSON.parse(response.responseBody);

            if (responseBody.success) {
                alert('Warga berhasil dihapus.');
                fetchWarga();
            } else { throw new Error(responseBody.message); }
        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    };

    const totalPages = Math.ceil(totalWarga / itemsPerPage);

    return (
        <>
            <main className="flex min-h-screen flex-col items-center bg-gray-100 p-4 sm:p-8">
                <div className="w-full max-w-6xl">
                    <div className="mb-6">
                        <Link href="/admin/dashboard" className="text-blue-500 hover:underline">← Kembali ke Dasbor Admin</Link>
                    </div>

                    {/* Form Tambah Warga */}
                    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Tambah Warga Baru</h2>
                        <form onSubmit={handleAddWarga} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input name="nama" value={formState.nama} onChange={handleInputChange} placeholder="Nama Lengkap" required className="p-2 border rounded" />
                            <input name="nomorRumah" value={formState.nomorRumah} onChange={handleInputChange} placeholder="Nomor Rumah (e.g. A1)" required className="p-2 border rounded" />
                            <input name="email" value={formState.email} onChange={handleInputChange} type="email" placeholder="Email" required className="p-2 border rounded" />
                            <input name="password" value={formState.password} onChange={handleInputChange} type="password" placeholder="Password Sementara" required className="p-2 border rounded" minLength="8" />

                            {error && <p className="md:col-span-2 text-sm text-red-500">{error}</p>}

                            <div className="md:col-span-2">
                                <button type="submit" disabled={isSubmitting} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400">
                                    {isSubmitting ? 'Menambahkan...' : 'Tambah Warga'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Daftar Warga */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Daftar Warga</h2>
                        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                            <input
                                type="search"
                                value={searchQuery}
                                // Langsung update saat pengguna mengetik
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari nama warga..."
                                className="p-2 border rounded flex-grow"
                            />
                            <button type="submit" className="bg-blue-500 text-white font-bold py-2 px-4 rounded">Cari</button>
                        </form>
                        <div className="overflow-x-auto border rounded-lg">
                            <table className="min-w-full bg-white">
                                <thead className="bg-gray-200">
                                    <tr>
                                        <th className="py-3 px-4 text-left">Nama</th>
                                        <th className="py-3 px-4 text-left">No. Rumah</th>
                                        <th className="py-3 px-4 text-left">User ID</th>
                                        <th className="py-3 px-4 text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (<tr><td colSpan="4">Memuat...</td></tr>) : filteredWarga.map(warga => (
                                        <tr key={warga.$id} className="hover:bg-gray-50">
                                            <td className="py-3 px-4 border-t">{warga.nama}</td>
                                            <td className="py-3 px-4 border-t">{warga.nomorRumah}</td>
                                            <td className="py-3 px-4 border-t text-xs font-mono">{warga.userId}</td>
                                            <td className="py-3 px-4 border-t text-center space-x-2">
                                                <button onClick={() => handleOpenEditModal(warga)} className="bg-yellow-500 text-white text-xs font-bold py-1 px-2 rounded">Edit</button>
                                                <button onClick={() => handleDeleteWarga(warga)} className="bg-red-500 text-white text-xs font-bold py-1 px-2 rounded">Hapus</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex justify-between items-center mt-4">
                            <span className="text-sm text-gray-700">
                                Halaman {currentPage} dari {totalPages} (Total {totalWarga} warga)
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => prev - 1)}
                                    disabled={currentPage === 1}
                                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-1 px-3 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Sebelumnya
                                </button>
                                <button
                                    onClick={() => setCurrentPage(prev => prev + 1)}
                                    disabled={currentPage >= totalPages}
                                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-1 px-3 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Selanjutnya
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            {showEditModal && editingWarga && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Edit Data Warga</h2>
                        <form onSubmit={handleUpdateWarga} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium">Nama Lengkap</label>
                                <input value={editingWarga.nama} onChange={(e) => setEditingWarga({ ...editingWarga, nama: e.target.value })} required className="p-2 border rounded w-full" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Nomor Rumah</label>
                                <input value={editingWarga.nomorRumah} onChange={(e) => setEditingWarga({ ...editingWarga, nomorRumah: e.target.value })} required className="p-2 border rounded w-full" />
                            </div>
                            <div className="flex justify-end gap-4 mt-6">
                                <button type="button" onClick={handleCloseEditModal} className="px-4 py-2 bg-gray-200 rounded">Batal</button>
                                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-green-500 text-white rounded disabled:bg-gray-400">
                                    {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}