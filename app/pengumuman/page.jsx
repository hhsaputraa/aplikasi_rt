// app/pengumuman/page.jsx
"use client";

import { useEffect, useState } from "react";
import { databases } from "@/app/lib/appwrite";
import { Query } from "appwrite";
import Link from "next/link";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const PENGUMUMAN_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_PENGUMUMAN_COLLECTION_ID

export default function PengumumanPage() {
    const [announcements, setAnnouncements] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
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

        fetchAnnouncements();
    }, []);

    return (
        <main className="flex min-h-screen flex-col items-center bg-gray-100 p-4 sm:p-8">
            <div className="w-full max-w-4xl">
                <div className="mb-6 flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-gray-800">Papan Pengumuman</h1>
                    <Link href="/dashboard" className="text-blue-500 hover:underline">Kembali ke Dasbor</Link>
                </div>

                <div className="space-y-4">
                    {isLoading ? <p>Memuat pengumuman...</p> : announcements.length > 0 ? announcements.map(item => (
                        <div key={item.$id} className="bg-white p-6 rounded-lg shadow-md">
                            <h2 className="text-xl font-bold mb-2">{item.judul}</h2>
                            <p className="text-gray-700 whitespace-pre-wrap">{item.isi}</p>
                            <p className="text-xs text-gray-500 mt-4 pt-4 border-t">
                                Dipublikasikan oleh <strong>{item.penulis}</strong> pada {new Date(item.$createdAt).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}
                            </p>
                        </div>
                    )) : (
                        <p className="text-center text-gray-500">Belum ada pengumuman.</p>
                    )}
                </div>
            </div>
        </main>
    );
}