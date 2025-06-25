// app/admin/pengumuman/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { databases, ID } from "@/app/lib/appwrite";
import { Query } from "appwrite";
import Link from "next/link";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const PENGUMUMAN_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_PENGUMUMAN_COLLECTION_ID

export default function PengumumanManagementPage() {
    const { user } = useAuth();
    const [announcements, setAnnouncements] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [formState, setFormState] = useState({ judul: '', isi: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchAnnouncements = async () => {
        try {
            const response = await databases.listDocuments(DATABASE_ID, PENGUMUMAN_COLLECTION_ID, [Query.orderDesc('$createdAt')]);
            setAnnouncements(response.documents);
        } catch (error) {
            console.error("Gagal mengambil pengumuman:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const handleInputChange = (e) => {
        setFormState({ ...formState, [e.target.name]: e.target.value });
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!formState.judul || !formState.isi) return;

        setIsSubmitting(true);
        try {
            await databases.createDocument(
                DATABASE_ID,
                PENGUMUMAN_COLLECTION_ID,
                ID.unique(),
                {
                    judul: formState.judul,
                    isi: formState.isi,
                    penulis: user.name, // Menggunakan nama admin yang login
                }
            );
            alert("Pengumuman berhasil dibuat!");
            setFormState({ judul: '', isi: '' });
            fetchAnnouncements(); // Refresh list
        } catch (error) {
            alert("Gagal membuat pengumuman.");
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (docId) => {
        if (!confirm("Anda yakin ingin menghapus pengumuman ini?")) return;

        try {
            await databases.deleteDocument(DATABASE_ID, PENGUMUMAN_COLLECTION_ID, docId);
            alert("Pengumuman berhasil dihapus.");
            fetchAnnouncements(); // Refresh list
        } catch (error) {
            alert("Gagal menghapus pengumuman.");
            console.error(error);
        }
    };

    return (
        <main className="flex min-h-screen flex-col items-center bg-gray-100 p-4 sm:p-8">
            <div className="w-full max-w-4xl">
                <div className="mb-6">
                    <Link href="/admin/dashboard" className="text-blue-500 hover:underline">← Kembali ke Dasbor Admin</Link>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Buat Pengumuman Baru</h2>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <input name="judul" value={formState.judul} onChange={handleInputChange} placeholder="Judul Pengumuman" required className="p-2 w-full border rounded" />
                        <textarea name="isi" value={formState.isi} onChange={handleInputChange} placeholder="Isi pengumuman..." required rows="4" className="p-2 w-full border rounded"></textarea>
                        <button type="submit" disabled={isSubmitting} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400">
                            {isSubmitting ? 'Memublikasikan...' : 'Publikasikan'}
                        </button>
                    </form>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Daftar Pengumuman</h2>
                    <div className="space-y-4">
                        {isLoading ? <p>Memuat...</p> : announcements.map(item => (
                            <div key={item.$id} className="border p-4 rounded-lg flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold">{item.judul}</h3>
                                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{item.isi}</p>
                                    <p className="text-xs text-gray-400 mt-2">Oleh: {item.penulis} - {new Date(item.$createdAt).toLocaleString('id-ID')}</p>
                                </div>
                                <button onClick={() => handleDelete(item.$id)} className="bg-red-500 text-white text-xs font-bold py-1 px-2 rounded hover:bg-red-600">
                                    Hapus
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </main>
    )
}