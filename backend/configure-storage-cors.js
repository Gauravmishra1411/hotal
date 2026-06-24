const { initializeApp, cert } = require('firebase-admin/app');
const { getStorage } = require('firebase-admin/storage');
const path = require('path');
const serviceAccountPath = path.join(__dirname, '../service-account.json');
const serviceAccount = require(serviceAccountPath);

const bucketNames = [
  'hotalmanegment-63681.firebasestorage.app',
  'hotalmanegment-63681.appspot.com'
];

async function configureCorsForBucket(bucketName) {
  console.log(`\n========================================`);
  console.log(`Attempting to configure CORS for bucket: ${bucketName}`);
  
  const appName = `app-${bucketName}`;
  let app;
  try {
    app = initializeApp({
      credential: cert(serviceAccount),
      storageBucket: bucketName
    }, appName);
  } catch (initErr) {
    console.error(`Initialization failed for ${bucketName}:`, initErr.message);
    return false;
  }

  const storage = getStorage(app);
  const bucket = storage.bucket();

  try {
    const [exists] = await bucket.exists();
    if (!exists) {
      console.warn(`Bucket ${bucketName} does NOT exist. skipping.`);
      await app.delete();
      return false;
    }

    console.log(`Bucket ${bucketName} exists! Getting metadata...`);
    const [metadata] = await bucket.getMetadata();
    console.log(`Bucket location: ${metadata.location}`);
    
    console.log(`Setting CORS configuration on ${bucketName}...`);
    await bucket.setCorsConfiguration([
      {
        origin: ['*'],
        method: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
        responseHeader: ['*'],
        maxAgeSeconds: 3600
      }
    ]);
    console.log(`SUCCESS: CORS configured successfully for ${bucketName}!`);
    await app.delete();
    return true;
  } catch (error) {
    console.error(`FAILED for ${bucketName}:`, error.message);
    try {
      await app.delete();
    } catch(e) {}
    return false;
  }
}

async function run() {
  let success = false;
  for (const name of bucketNames) {
    const res = await configureCorsForBucket(name);
    if (res) success = true;
  }
  if (success) {
    console.log('\nCORS configuration completed successfully!');
  } else {
    console.error('\nCould not configure CORS on any of the buckets. Please ensure Storage is enabled in the Firebase Console at https://console.firebase.google.com/');
  }
}

run();
