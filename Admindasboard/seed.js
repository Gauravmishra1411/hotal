import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC59rKvBN-hFxKRba1LJQpmr5ta4fQNVmw",
  authDomain: "hotalmanegment-63681.firebaseapp.com",
  projectId: "hotalmanegment-63681",
  storageBucket: "hotalmanegment-63681.appspot.com",
  messagingSenderId: "432214806858",
  appId: "1:432214806858:web:d0b91b0c27b6e23547f1b3",
  measurementId: "G-RP8D0EP0PY"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const servicesToSeed = [
  { name: "Room Cleaning", price: 0, active: true },
  { name: "Extra Towels", price: 0, active: true },
  { name: "In-Room Dining", price: 25, active: true },
  { name: "Laundry Service", price: 15, active: true },
  { name: "Spa Appointment", price: 100, active: true },
  { name: "Airport Transfer", price: 50, active: true }
];

async function seed() {
  console.log("Seeding services...");
  const servicesCol = collection(db, "services");
  for (const service of servicesToSeed) {
    await addDoc(servicesCol, {
      ...service,
      createdAt: serverTimestamp()
    });
    console.log(`Added: ${service.name}`);
  }
  console.log("Done seeding!");
  process.exit(0);
}

seed().catch(console.error);
