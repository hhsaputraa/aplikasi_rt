"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';
import { account, databases, storage, ID, client } from '../lib/appwrite';
import { Query } from 'appwrite';

// Membaca ID dari environment variables
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const WARGA_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_WARGA_COLLECTION_ID;
const IURAN_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_IURAN_COLLECTION_ID;
const BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_PAYMENT_BUCKET_ID;

export default function DashboardPage() {
    // === BAGIAN STATE MANAGEMENT ===
    const { user, isLoading, logout } = useAuth();
    const router = useRouter();

    const [wargaInfo, setWargaInfo] = useState(null);
    const [dues, setDues] = useState([]);
    const [pageLoading, setPageLoading] = useState(true);

    // State baru untuk modal dan proses upload
    const [showModal, setShowModal] = useState(false);
    const [selectedDue, setSelectedDue] = useState(null);
    const [paymentProof, setPaymentProof] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    // === BAGIAN EFFECTS ===
    useEffect(() => {
        // Redirect jika tidak login
        if (!isLoading && !user) {
            router.push('/');
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        // Fetch data setelah user terverifikasi
        if (user) {
            const fetchData = async () => {
                try {
                    // 1. Cari dokumen 'warga' berdasarkan 'userId' dari pengguna yang login
                    const wargaResponse = await databases.listDocuments(
                        DATABASE_ID,
                        WARGA_COLLECTION_ID,
                        [Query.equal('userId', user.$id)]
                    );

                    if (wargaResponse.documents.length > 0) {
                        const currentWarga = wargaResponse.documents[0];
                        setWargaInfo(currentWarga);

                        // 2. Gunakan ID dokumen 'warga' untuk mencari semua iurannya
                        const iuranResponse = await databases.listDocuments(
                            DATABASE_ID,
                            IURAN_COLLECTION_ID,
                            [Query.equal('wargaId', currentWarga.$id), Query.orderDesc('$createdAt')]
                        );
                        setDues(iuranResponse.documents);
                    }
                } catch (error) {
                    console.error("Gagal mengambil data:", error);
                } finally {
                    setPageLoading(false);
                }
            };

            fetchData();
        }
    }, [user]);

    useEffect(() => {
        // Pastikan kita punya ID database dan koleksi sebelum subscribe
        if (!DATABASE_ID || !IURAN_COLLECTION_ID) return;

        // Channel yang akan kita "dengarkan" perubahannya
        const channel = `databases.${DATABASE_ID}.collections.${IURAN_COLLECTION_ID}.documents`;

        // Subscribe ke channel
        const unsubscribe = client.subscribe(channel, (response) => {
            // Cek apakah eventnya adalah update dokumen
            const event = response.events.find(e => e.endsWith('.update'));
            if (event) {
                const updatedDoc = response.payload;
                console.log('Realtime update diterima:', updatedDoc);

                // Cek apakah dokumen yang diupdate adalah milik warga yang sedang login
                if (wargaInfo && updatedDoc.wargaId === wargaInfo.$id) {
                    // Update state 'dues' secara lokal untuk merefleksikan perubahan
                    setDues(currentDues =>
                        currentDues.map(d =>
                            d.$id === updatedDoc.$id ? updatedDoc : d
                        )
                    );
                }
            }
        });

        console.log(`Berlangganan ke channel: ${channel}`);

        // Fungsi cleanup: berhenti berlangganan saat komponen di-unmount
        return () => {
            unsubscribe();
            console.log(`Berhenti berlangganan dari channel: ${channel}`);
        };

    }, [wargaInfo]);

    // === BAGIAN HANDLER FUNCTIONS ===
    const handleOpenModal = (due) => {
        setSelectedDue(due);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedDue(null);
        setPaymentProof(null);
    };

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setPaymentProof(e.target.files[0]);
        }
    };

    const handlePaymentConfirmation = async (e) => {
        e.preventDefault();
        if (!paymentProof || !selectedDue) return;

        setIsUploading(true);
        try {
            // 1. Upload file bukti bayar ke Storage
            const fileResponse = await storage.createFile(BUCKET_ID, ID.unique(), paymentProof);
            const fileId = fileResponse.$id;

            // 2. Update dokumen iuran di Database
            const updatedDocument = await databases.updateDocument(
                DATABASE_ID,
                IURAN_COLLECTION_ID,
                selectedDue.$id,
                {
                    status: 'MENUNGGU_VALIDASI',
                    buktiPembayaran: fileId,
                    tanggalBayar: new Date().toISOString(),
                }
            );

            // 3. Update state di frontend agar UI langsung berubah
            setDues(currentDues =>
                currentDues.map(d => (d.$id === selectedDue.$id ? updatedDocument : d))
            );

            alert('Konfirmasi berhasil diunggah! Mohon tunggu validasi dari pengurus.');
            handleCloseModal();

        } catch (error) {
            console.error("Gagal melakukan konfirmasi:", error);
            alert('Gagal mengunggah bukti pembayaran. Coba lagi.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            alert('Logout berhasil!');
            router.push('/');
        } catch (error) {
            console.error("Gagal logout:", error);
            alert('Gagal untuk logout.');
        }
    };

    // === BAGIAN RENDER ===
    if (isLoading || pageLoading) {
        return <div className="flex min-h-screen items-center justify-center">Loading data...</div>;
    }

    if (user && wargaInfo) {
        return (
            <>
                <main className="flex min-h-screen flex-col items-center bg-gray-100 p-4 sm:p-8">
                    <div className="w-full max-w-4xl bg-white p-6 rounded-lg shadow-md">

                        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Dasbor Warga</h1>
                                <p className="text-md text-gray-600">Selamat Datang, {wargaInfo.nama}!</p>
                            </div>
                            <Link href="/profil" className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">
                                Profil Saya
                            </Link>
                            <button onClick={handleLogout} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg">
                                Logout
                            </button>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
                            <h2 className="text-xl font-semibold text-blue-800">Informasi Anda</h2>
                            <p><strong>Nama:</strong> {wargaInfo.nama}</p>
                            <p><strong>No. Rumah:</strong> {wargaInfo.nomorRumah}</p>
                        </div>

                        <div>
                            <h2 className="text-xl font-semibold text-gray-700 mb-4">Riwayat Iuran Anda</h2>
                            <div className="overflow-x-auto border rounded-lg">
                                <table className="min-w-full bg-white">
                                    <thead className="bg-gray-200">
                                        <tr>
                                            <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-600">Periode</th>
                                            <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-600">Jumlah</th>
                                            <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-600">Status</th>
                                            <th className="py-3 px-4 border-b text-center text-sm font-semibold text-gray-600">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dues.length > 0 ? dues.map(due => (
                                            <tr key={due.$id} className="hover:bg-gray-50">
                                                <td className="py-3 px-4 border-b">{due.periode}</td>
                                                <td className="py-3 px-4 border-b">Rp {due.jumlah.toLocaleString('id-ID')}</td>
                                                <td className="py-3 px-4 border-b">
                                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${due.status === 'LUNAS' ? 'bg-green-100 text-green-800' :
                                                        due.status === 'BELUM_LUNAS' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        {due.status.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="py-2 px-4 border-b text-center">
                                                    {due.status === 'BELUM_LUNAS' && (
                                                        <button onClick={() => handleOpenModal(due)} className="bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold py-1 px-3 rounded-md transition-colors">
                                                            Konfirmasi Bayar
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan="4" className="text-center py-4 text-gray-500">Tidak ada data iuran.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>
                </main>

                {/* Modal Pop-up untuk Konfirmasi Pembayaran */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                        <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                            <h2 className="text-xl font-bold mb-4">Konfirmasi Iuran Periode {selectedDue.periode}</h2>
                            <form onSubmit={handlePaymentConfirmation}>
                                <div className="mb-4">
                                    <label htmlFor="paymentProof" className="block text-sm font-medium text-gray-700 mb-2">
                                        Unggah Bukti Pembayaran (Gambar/PDF)
                                    </label>
                                    <input
                                        type="file"
                                        id="paymentProof"
                                        onChange={handleFileChange}
                                        accept="image/*,application/pdf"
                                        required
                                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    />
                                </div>
                                <div className="flex justify-end gap-4 mt-6">
                                    <button type="button" onClick={handleCloseModal} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isUploading || !paymentProof}
                                        className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                    >
                                        {isUploading ? 'Mengunggah...' : 'Kirim Konfirmasi'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </>
        );
    }

    return null;
}