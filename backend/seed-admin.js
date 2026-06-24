const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const path = require('path');
const serviceAccount = require(path.join(__dirname, '../service-account.json'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

const servicesToSeed = [
  { name: "Room Cleaning", price: 0, active: true },
  { name: "Extra Towels", price: 0, active: true },
  { name: "In-Room Dining", price: 25, active: true },
  { name: "Laundry Service", price: 15, active: true },
  { name: "Spa Appointment", price: 100, active: true },
  { name: "Airport Transfer", price: 50, active: true }
];

async function seed() {
  console.log("Seeding services via Admin SDK...");
  const servicesCol = db.collection("services");
  
  for (const service of servicesToSeed) {
    await servicesCol.add({
      ...service,
      createdAt: FieldValue.serverTimestamp()
    });
    console.log(`Added: ${service.name}`);
  }
  console.log("Done seeding!");
  process.exit(0);
}

seed().catch(console.error);
