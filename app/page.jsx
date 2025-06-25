// app/page.jsx
"use client";

import { useState } from 'react';
import { account } from './lib/appwrite';
import { useAuth } from './context/AuthContext';
import Image from 'next/image';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Fungsi untuk login dengan email & password
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError(''); // Bersihkan error lama
    try {
      await login(email, password);
      // HAPUS router.push DARI SINI.
      // Pengalihan rute sekarang sepenuhnya diatur oleh fungsi `login` di AuthContext.
    } catch (err) {
      console.error('Gagal Login Email:', err);
      setError(err.message || 'Email atau password salah.');
    }
  };

  // Fungsi untuk login dengan Google (untuk nanti saat deploy)
  const handleGoogleLogin = async () => {
    try {
      // NOTE: Ini kemungkinan akan gagal di localhost karena isu cookie
      // Redirect URL untuk Google OAuth juga perlu dicek dan disesuaikan nanti
      account.createOAuth2Session('google', `${window.location.origin}/dashboard`, `${window.location.origin}/`);
    } catch (error) {
      console.error("Gagal memulai sesi Google OAuth", error);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm p-8 space-y-4 bg-white shadow-lg rounded-xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800">Selamat Datang!</h1>
          <p className="text-gray-500 mt-2">Portal Informasi dan Iuran Warga</p>
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <input
              className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              id="email" type="email" placeholder="Email"
              value={email} onChange={(e) => setEmail(e.target.value)} required
            />
          </div>
          <div>
            <input
              className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              id="password" type="password" placeholder="Password"
              value={password} onChange={(e) => setPassword(e.target.value)} required
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button
            className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors"
            type="submit"
          >
            Masuk
          </button>
        </form>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="flex-shrink mx-4 text-gray-400 text-sm">atau</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center py-2 px-4 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-all"
        >
          <Image src="/google-logo.svg" alt="Google Logo" width={20} height={20} />
          <span className="ml-3 font-semibold text-gray-700">Masuk dengan Google</span>
        </button>
      </div>
    </main>
  );
}