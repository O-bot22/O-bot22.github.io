// A simple script to add data to your LOCAL emulator
const admin = require("firebase-admin");
var fs = require("fs");

// Tell the script to talk to the EMULATOR, not production
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8888";

admin.initializeApp({ projectId: "puerto-real-energy-poverty" });
const db = admin.firestore();

var snapshot = JSON.parse(fs.readFileSync('firebase_data_copy/snapshot.json', 'utf8'));


async function seed() {
  // Define your specific ID here (from your screenshot)
  for (const [docId, zoneData] of Object.entries(snapshot)) {
    const docRef = db.collection("Zones").doc(docId);


    try {
      // 4. Use .set() to create or overwrite the document with your ID
      await docRef.set(zoneData);
      console.log(`✅ Document ${docId} created successfully!`);
    } catch (error) {
      console.error("❌ Error seeding document:", error);
    }
  }
}

seed();