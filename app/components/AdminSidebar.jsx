// components/AdminSidebar.jsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

const navLinks = [
    { name: "Dasbor", href: "/admin/dashboard" },
    { name: "Validasi Pembayaran", href: "/admin/validasi" },
    { name: "Manajemen Warga", href: "/admin/warga" },
    { name: "Manajemen Pengumuman", href: "/admin/pengumuman" },
    { name: "Laporan Keuangan", href: "/admin/laporan" },
];

export default function AdminSidebar() {
    const pathname = usePathname();
    const { logout } = useAuth();

    return (
        <aside className="w-64 bg-gray-800 text-white flex flex-col">
            <div className="p-6 text-2xl font-bold border-b border-gray-700">
                Panel Admin
            </div>
            <nav className="flex-grow p-4 space-y-2">
                {navLinks.map((link) => {
                    const isActive = pathname === link.href;
                    return (
                        <Link
                            key={link.name}
                            href={link.href}
                            className={`block py-2.5 px-4 rounded transition duration-200 ${isActive ? 'bg-blue-500 text-white' : 'hover:bg-gray-700'
                                }`}
                        >
                            {link.name}
                        </Link>
                    );
                })}
            </nav>
            <div className="p-4 border-t border-gray-700">
                <Link href="/profil" className="block text-center w-full py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700 mb-2">Profil Saya</Link>
                <button onClick={logout} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
                    Logout
                </button>
            </div>
        </aside>
    );
}