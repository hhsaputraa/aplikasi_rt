// app/admin/layout.jsx
"use client";

import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import AdminSidebar from "../components/AdminSidebar";

export default function AdminLayout({ children }) {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading) {
            if (!user || !user.labels.includes('admin')) {
                router.push('/dashboard');
            }
        }
    }, [user, isLoading, router]);

    if (isLoading || !user || !user.labels.includes('admin')) {
        return <div className="flex min-h-screen items-center justify-center">Memverifikasi akses...</div>;
    }

    // Tampilkan layout dengan sidebar
    return (
        <div className="flex min-h-screen">
            <AdminSidebar />
            <main className="flex-grow bg-gray-100">
                {children}
            </main>
        </div>
    );
}