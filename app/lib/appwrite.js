// app/lib/appwrite.js
import { Client, Account, Databases, Storage, ID,Functions  } from 'appwrite'; // <-- Tambahkan Storage dan ID

const client = new Client();

client
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client); // <-- Tambahkan ini
export const functions = new Functions(client);
export { ID }; // <-- Tambahkan ini juga
export { client };