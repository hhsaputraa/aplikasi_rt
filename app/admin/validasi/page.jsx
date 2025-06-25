// app/(admin)/validasi/page.jsx
"use client";

import { useEffect, useState } from "react";
import { databases, storage } from "@/app/lib/appwrite";
import { Query } from "appwrite";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Membaca ID dari environment variables
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const IURAN_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_IURAN_COLLECTION_ID;
const BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_PAYMENT_BUCKET_ID;

export default function ValidationPage() {
    const [validations, setValidations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchValidations = async () => {
            setIsLoading(true);
            try {
                const response = await databases.listDocuments(
                    DATABASE_ID,
                    IURAN_COLLECTION_ID,
                    [Query.equal('status', 'MENUNGGU_VALIDASI')]
                );
                setValidations(response.documents);
            } catch (error) {
                console.error("Gagal mengambil data validasi:", error);
                alert("Gagal mengambil data validasi.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchValidations();
    }, []);

    const viewProof = (fileId) => {
        try {
            const url = storage.getFileView(BUCKET_ID, fileId);
            window.open(url, '_blank');
        } catch (error) {
            console.error("Gagal mendapatkan URL bukti:", error);
            alert("Tidak bisa menampilkan bukti pembayaran.");
        }
    };

    const handleAction = async (documentId, newStatus) => {
        try {
            const payload = { status: newStatus };
            if (newStatus === 'BELUM_LUNAS') {
                // Jika ditolak, kita hapus juga info pembayarannya
                payload.buktiPembayaran = null;
                payload.tanggalBayar = null;
            }
            await databases.updateDocument(
                DATABASE_ID,
                IURAN_COLLECTION_ID,
                documentId,
                payload
            );

            // Hapus item dari list di UI secara real-time
            setValidations(currentValidations =>
                currentValidations.filter(v => v.$id !== documentId)
            );
            alert(`Status iuran berhasil diubah menjadi ${newStatus}`);
        } catch (error) {
            console.error("Gagal mengupdate status:", error);
            alert("Gagal mengupdate status iuran.");
        }
    };

    if (isLoading) {
        return <div className="flex min-h-screen items-center justify-center">Memuat data...</div>
    }

    return (
        <main className="flex min-h-screen flex-col items-center bg-gray-100 p-4 sm:p-8">
            <div className="w-full max-w-6xl bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">Validasi Pembayaran</h1>
                    <Link href="/admin/dashboard" className="text-blue-500 hover:underline">Kembali ke Dasbor Warga</Link>
                </div>

                <div className="overflow-x-auto border rounded-lg">
                    <table className="min-w-full bg-white">
                        <thead className="bg-gray-200">
                            <tr>
                                <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-600">ID Warga</th>
                                <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-600">Periode</th>
                                <th className="py-3 px-4 border-b text-center text-sm font-semibold text-gray-600">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {validations.length > 0 ? validations.map(item => (
                                <tr key={item.$id} className="hover:bg-gray-50">
                                    <td className="py-3 px-4 border-b text-xs font-mono">{item.wargaId}</td>
                                    <td className="py-3 px-4 border-b">{item.periode}</td>
                                    <td className="py-2 px-4 border-b text-center space-x-2">
                                        <button onClick={() => viewProof(item.buktiPembayaran)} className="bg-blue-500 text-white text-xs font-bold py-1 px-3 rounded-md">Lihat Bukti</button>
                                        <button onClick={() => handleAction(item.$id, 'LUNAS')} className="bg-green-500 text-white text-xs font-bold py-1 px-3 rounded-md">Setujui</button>
                                        <button onClick={() => handleAction(item.$id, 'BELUM_LUNAS')} className="bg-red-500 text-white text-xs font-bold py-1 px-3 rounded-md">Tolak</button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="3" className="text-center py-4 text-gray-500">Tidak ada pembayaran yang perlu divalidasi.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    )
}