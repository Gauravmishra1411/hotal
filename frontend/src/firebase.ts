import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyC59rKvBN-hFxKRba1LJQpmr5ta4fQNVmw",
  authDomain: "hotalmanegment-63681.firebaseapp.com",
  projectId: "hotalmanegment-63681",
  storageBucket: "hotalmanegment-63681.appspot.com",
  messagingSenderId: "432214806858",
  appId: "1:432214806858:web:d0b91b0c27b6e23547f1b3",
  measurementId: "G-RP8D0EP0PY"
};

// Prevent duplicate initialization during hot-reloads (HMR)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
storage.maxUploadRetryTime = 10000; // Fail fast in 10 seconds if Storage is disabled/missing
