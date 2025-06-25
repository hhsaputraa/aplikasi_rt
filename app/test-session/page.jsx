// app/test-session/page.jsx
"use client";

import { account } from "../lib/appwrite"; // Impor dari konfigurasi Anda

export default function TestSessionPage() {

    const checkSession = async () => {
        console.log("Mencoba mengambil sesi akun...");
        try {
            const currentUser = await account.get();
            console.log("✅ BERHASIL! Data Pengguna:", currentUser);
            alert("Sesi ditemukan! Lihat console untuk detailnya.");
        } catch (error) {
            console.error("❌ GAGAL! Error:", error);
            alert(`Gagal mendapatkan sesi. Lihat console untuk detail errornya. Pesan: ${error.message}`);
        }
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-24">
            <div className="text-center">
                <h1 className="text-2xl font-bold mb-4">Halaman Tes Sesi</h1>
                <p className="mb-6">Halaman ini digunakan untuk mendiagnosis masalah sesi login.</p>
                <button
                    onClick={checkSession}
                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg"
                >
                    Cek Sesi Saya Sekarang
                </button>
                <p className="mt-4 text-sm text-gray-600">
                    Ikuti instruksi, lalu klik tombol di atas dan periksa Console browser (F12).
                </p>
            </div>
        </main>
    );
}