// app/context/AuthContext.js
"use client";

import { createContext, useState, useEffect, useContext } from 'react';
import { account } from '../lib/appwrite';
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkUserSession();
  }, []);

  const checkUserSession = async () => {
    setIsLoading(true);
    try {
      const currentUser = await account.get();
      setUser(currentUser);
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // FUNGSI BARU UNTUK LOGIN
  const login = async (email, password) => {
    try {
      await account.createEmailPasswordSession(email, password);
      const loggedInUser = await account.get(); // Ambil data user yang baru login
      setUser(loggedInUser) // Ambil data user baru dan update state
      if (loggedInUser.labels.includes('admin')) {
        router.push('/admin/dashboard'); // Arahkan admin ke dasbor admin
      } else {
        router.push('/dashboard'); // Arahkan warga ke dasbor warga
      }
    } catch (error) {
      throw error; 
    }
  };

  // FUNGSI BARU UNTUK LOGOUT
  const logout = async () => {
    try {
      await account.deleteSession('current');
      setUser(null); // Kosongkan state user secara manual
      router.push('/');
    } catch (error) {
      throw error; // Lemparkan error jika ada
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};