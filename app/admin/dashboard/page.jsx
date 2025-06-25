// app/(admin)/dashboard/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { databases, functions } from "@/app/lib/appwrite";
import { Query } from "appwrite";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Membaca ID dari environment variables
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const WARGA_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_WARGA_COLLECTION_ID;
const IURAN_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_IURAN_COLLECTION_ID;
const GENERATE_DUES_FUNCTION_ID = process.env.NEXT_PUBLIC_APPWRITE_GENERATE_DUES_FUNCTION_ID;

// Komponen untuk kartu statistik
const StatCard = ({ title, value, icon }) => (
    <div className="bg-white p-6 rounded-lg shadow-md flex items-center">
        <div className="mr-4 text-3xl text-blue-500">{icon}</div>
        <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);

export default function AdminDashboardPage() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState({ totalWarga: 0, pendingValidasi: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [periode, setPeriode] = useState('');
    const [jumlah, setJumlah] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Mengambil data secara paralel
                const [wargaResponse, validasiResponse] = await Promise.all([
                    databases.listDocuments(DATABASE_ID, WARGA_COLLECTION_ID),
                    databases.listDocuments(DATABASE_ID, IURAN_COLLECTION_ID, [Query.equal('status', 'MENUNGGU_VALIDASI')])
                ]);

                setStats({
                    totalWarga: wargaResponse.total,
                    pendingValidasi: validasiResponse.total
                });
            } catch (error) {
                console.error("Gagal mengambil statistik:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, []);

    const handleLogout = async () => {
        await logout();
    };

    const handleGenerateDues = async (e) => {
        e.preventDefault();
        if (!periode || !jumlah) {
            alert('Periode dan Jumlah wajib diisi.');
            return;
        }

        // Konfirmasi sebelum menjalankan aksi besar
        const isConfirmed = confirm(`Anda yakin ingin membuat tagihan untuk periode ${periode} sebesar Rp ${jumlah}? Proses ini tidak bisa dibatalkan.`);
        if (!isConfirmed) return;

        setIsGenerating(true);
        try {
            const payload = JSON.stringify({ periode, jumlah: parseInt(jumlah) });
            const response = await functions.createExecution(GENERATE_DUES_FUNCTION_ID, payload);

            const responseBody = JSON.parse(response.responseBody);
            if (responseBody.success) {
                alert(`Sukses! ${responseBody.message}`);
            } else {
                throw new Error(responseBody.message);
            }
        } catch (error) {
            console.error("Gagal generate iuran:", error);
            alert(`Error: ${error.message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    if (isLoading) {
        return <div className="flex min-h-screen items-center justify-center">Memuat statistik...</div>
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <header className="bg-white shadow-md">
                <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 className="text-xl font-bold text-gray-800">Dasbor Admin</h1>
                    <button onClick={handleLogout} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg">
                        Logout
                    </button>
                </nav>
            </header>

            <main className="container mx-auto px-6 py-8">
                <h2 className="text-2xl font-semibold text-gray-700 mb-6">Selamat Datang, {user?.name || 'Admin'}!</h2>

                <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-gray-700 mb-4">Buat Iuran Bulanan</h3>
                    <form onSubmit={handleGenerateDues} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div>
                            <label htmlFor="periode" className="block text-sm font-medium text-gray-600">Periode (YYYY-MM)</label>
                            <input id="periode" type="text" value={periode} onChange={(e) => setPeriode(e.target.value)} placeholder="Contoh: 2025-07" required className="mt-1 p-2 w-full border rounded" />
                        </div>
                        <div>
                            <label htmlFor="jumlah" className="block text-sm font-medium text-gray-600">Jumlah (Rp)</label>
                            <input id="jumlah" type="number" value={jumlah} onChange={(e) => setJumlah(e.target.value)} placeholder="Contoh: 100000" required className="mt-1 p-2 w-full border rounded" />
                        </div>
                        <button type="submit" disabled={isGenerating} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-5 rounded-lg transition-colors disabled:bg-gray-400">
                            {isGenerating ? 'Memproses...' : 'Buat Tagihan'}
                        </button>
                    </form>
                </div>

                {/* Bagian Kartu Statistik */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <StatCard title="Total Warga Terdaftar" value={stats.totalWarga} icon="👥" />
                    <StatCard title="Menunggu Validasi" value={stats.pendingValidasi} icon="⏳" />
                    <StatCard title="Fitur Selanjutnya" value="..." icon="✨" />
                </div>

                {/* Bagian Navigasi Aksi */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-gray-700 mb-4">Aksi Cepat</h3>
                    <div className="flex flex-wrap gap-4">
                        <Link href="/admin/validasi" className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-5 rounded-lg transition-colors">
                            Validasi Pembayaran
                        </Link>
                        <Link href="/admin/warga" className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-5 rounded-lg">
                            Manajemen Warga
                        </Link>
                        <Link href="/admin/laporan" className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-5 rounded-lg transition-colors">
                            Lihat Laporan
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}