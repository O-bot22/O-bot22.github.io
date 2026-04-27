const admin = require('firebase-admin');

const production = true;

if(! production){
  // Tell the script to talk to the EMULATOR, not production
  process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8888";

  admin.initializeApp({ projectId: "puerto-real-energy-poverty" });
}else{
  const serviceAccount = require('C:/Users/owenr/Downloads/puerto-real-energy-poverty-firebase-adminsdk-fbsvc-261b0de29f.json');

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function removeFieldFromCollection(collectionName, fieldName) {
  const collectionRef = db.collection(collectionName);
  const snapshot = await collectionRef.get();
  
  if (snapshot.empty) {
    console.log('No documents found.');
    return;
  }

  const batch = db.batch();
  snapshot.docs.forEach(doc => {
    // Specify the path to the map, e.g., 'parentMap.childMap'

    batch.update(doc.ref, { [fieldName]: admin.firestore.FieldValue.delete() });
  });

  const res = await batch.commit();
  console.log(res);
  console.log(`Deleted ${snapshot.size} instances of ${fieldName}.`);
}

// Usage
removeFieldFromCollection('Zones', 'datasets.HVI');
// datasets.HVI is the table path that was to be deleted from every document (CUSEC) in the Zones collection
