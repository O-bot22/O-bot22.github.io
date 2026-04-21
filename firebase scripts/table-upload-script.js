// used to add a new table to every CUSEC document in the Zones collection


const admin = require('firebase-admin');
const serviceAccount = require('C:/Users/owenr/Downloads/puerto-real-energy-poverty-firebase-adminsdk-fbsvc-261b0de29f.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();
console.log("connected!");


const HVI_data = {};
const data = require("C:/Users/owenr/Downloads/HVI Data(Cleaned).json"); // Your converted Excel data
const hviMap = new Map(data.map(obj => [obj.Code, obj.HVI]));

// console.log(hviMap);
// console.log(hviMap.get(1102801001));
// console.log(hviMap.get(parseInt("1102801001")));


async function addFieldToAll() {
  const collectionRef = db.collection('Zones');
  const snapshot = await collectionRef.get();

  if (snapshot.empty) {
    console.log('No documents found.');
    return;
  }

    // adds a map names HVI to each document that has a key value pair of "HVI" and the corresponding HVI value for that CUSEC
    const updates = snapshot.docs.map(doc => {    
        // the name for a collection of fields in firestore is a map
        // console.log(hviMap.get(parseInt(doc.id)));
        const HVI = hviMap.get(parseInt(doc.id));
        if(HVI){
            doc.ref.update({"datasets.HVI": {"HVI": hviMap.get(parseInt(doc.id))}});
        }
    });

  await Promise.all(updates);
  console.log(`Updated ${snapshot.size} documents.`);
}

addFieldToAll();