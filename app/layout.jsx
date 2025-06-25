// app/layout.jsx
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";
import { Toaster } from "react-hot-toast"; // <-- 1. Impor

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Portal Warga",
  description: "Aplikasi Iuran dan Informasi Warga",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <Toaster position="top-center" />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}