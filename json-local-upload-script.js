/**
 * Used to upload JSON files to any collection
 * From an google sheet, first export as a CSV
 * next, use an online csv to json converter
 * finally, point to the file here
 * 
 * -> Service account credentials must be created in the Firestore portal under Setting -> Service Accounts
 * -> make sure to use a new collection name to avoid overwriting data
 */

const admin = require('firebase-admin');
const data = require('C:/Users/owenr/Downloads/Aggregated Amanda Data - Copy of Copy of Hoja1.json'); // Your converted Excel data

// Tell the script to talk to the EMULATOR, not production
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8888";

admin.initializeApp({ projectId: "puerto-real-energy-poverty" });
const db = admin.firestore();


async function upload(data) {
  for (const item of data) {
    await db.collection('Amanda').add(item);
    console.log('Added document');
  }
}

upload(data);