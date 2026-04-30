// used to add a new table to every CUSEC document in the Zones collection

// OLDDDDDDD

const admin = require('firebase-admin');
// Tell the script to talk to the EMULATOR, not production
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8888";

admin.initializeApp({ projectId: "puerto-real-energy-poverty" });
const db = admin.firestore();
console.log("connected!");


const HVI_data = {};
// const data = require("C:/Users/owenr/Downloads/HVI Data(Cleaned).json"); // Your converted Excel data
// const data = require("C:/Users/owenr/Downloads/HVI +HHI Data(Cleaned).json");
const data = require("C:/Users/owenr/Downloads/HVI +HHI Data(Cleaned) (1).json");
const hviMap = new Map(data.map(obj => {
  const datasets = {"HVI": obj.HVI, "HHI": obj.HHI, "HVI + HHI": obj["HVI + HHI"]}
  return [obj.Code, datasets];
}));
// ^ must manually map each dataset you want added to the table
// ^ the names in quotes are what show up on the website assuming no translation


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
        const datasets = hviMap.get(parseInt(doc.id));
        if(datasets){
            doc.ref.update({"datasets.HVI": datasets});
        }
    });

  await Promise.all(updates);
  console.log(`Updated ${snapshot.size} documents.`);
}

addFieldToAll();