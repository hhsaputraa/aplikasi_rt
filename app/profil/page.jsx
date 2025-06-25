// app/profil/page.jsx
"use client";

import { useAuth } from "../context/AuthContext";
import { account } from "../lib/appwrite";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ProfilePage() {
    const { user, isLoading, logout } = useAuth();
    const router = useRouter();
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/');
        }
    }, [user, isLoading, router]);

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (newPassword !== confirmPassword) {
            setError('Password baru dan konfirmasi tidak cocok.');
            return;
        }
        if (newPassword.length < 8) {
            setError('Password baru minimal harus 8 karakter.');
            return;
        }

        try {
            await account.updatePassword(newPassword, oldPassword);
            setSuccess('Password berhasil diperbarui!');
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            setError(err.message);
            console.error(err);
        }
    };

    if (isLoading || !user) {
        return <div className="flex min-h-screen items-center justify-center">Memuat...</div>;
    }

    return (
        <main className="min-h-screen bg-gray-100 p-4 sm:p-8 flex justify-center">
            <div className="w-full max-w-2xl space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-800">Profil Saya</h1>
                    <p className="text-gray-500">Kelola informasi akun Anda di sini.</p>
                </div>

                {/* Info Akun */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold border-b pb-3 mb-4">Informasi Akun</h2>
                    <div className="space-y-2">
                        <p><strong>Nama:</strong> {user.name}</p>
                        <p><strong>Email:</strong> {user.email}</p>
                        <p><strong>Terdaftar Sejak:</strong> {new Date(user.$createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                </div>

                {/* Ganti Password */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold border-b pb-3 mb-4">Ganti Password</h2>
                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium">Password Lama</label>
                            <input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required className="mt-1 p-2 w-full border rounded" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Password Baru</label>
                            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="mt-1 p-2 w-full border rounded" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Konfirmasi Password Baru</label>
                            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="mt-1 p-2 w-full border rounded" />
                        </div>
                        {error && <p className="text-sm text-red-500">{error}</p>}
                        {success && <p className="text-sm text-green-500">{success}</p>}
                        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                            Update Password
                        </button>
                    </form>
                </div>

                <div className="text-center">
                    <Link href={user.labels.includes('admin') ? "/admin/dashboard" : "/dashboard"} className="text-blue-500 hover:underline">
                        ← Kembali ke Dasbor
                    </Link>
                </div>
            </div>
        </main>
    );
}