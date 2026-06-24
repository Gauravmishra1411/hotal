const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');
const serviceAccount = require(path.join(__dirname, '../service-account.json'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function test() {
  const snap = await db.collection("services").get();
  console.log("Services count:", snap.size);
  snap.forEach(doc => {
    console.log(doc.id, doc.data());
  });
  process.exit(0);
}
test();
