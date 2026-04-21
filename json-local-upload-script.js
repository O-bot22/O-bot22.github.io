/**
 * Used to upload JSON files to any collection
 * From an google sheet, first export as a CSV
 * next, use an online csv to json converter
 * finally, point to the file here
 * 
 * -> Service account credentials must be created in the Firestore portal under Setting -> Service Accounts
 * -> make sure to use a new collection name to avoid overwriting data
 * 
 * Used files:
 * 'C:/Users/owenr/Downloads/Aggregated Amanda Data - Copy of Copy of Hoja1.json'
 * "C:/Users/owenr/Downloads/Previous Open Ended Puerto Real Data.xlsx - Database Format.json"
 * C:/Users/owenr/Downloads/Aggregated Amanda Data - Copy of Copy of Hoja1.json
 */


const data = require("C:/Users/owenr/Downloads/Survey Data - For Firebase Upload(Aggregated data for upload).json"); // Your converted Excel data
const document_name = "IQP Data";

console.log("File loaded");

const admin = require('firebase-admin');

// Tell the script to talk to the EMULATOR, not production
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8888";

admin.initializeApp({ projectId: "puerto-real-energy-poverty" });
const db = admin.firestore();
console.log("connected!");

async function upload(data) {
  for (const item of data) {
    const docRef = db.collection('City').doc(document_name);

    try {
      await docRef.set(item);
      console.log(`✅ Document ${document_name} created successfully!`);
    } catch (error) {
      console.error("❌ Error seeding document:", error);
    }
  }
}

upload(data);