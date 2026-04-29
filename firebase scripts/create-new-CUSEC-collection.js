// used to add any new collection that is sorted by CUSEC


const production = false;
const collection_name = "Heat Indices";
// const data = require("C:/Users/owenr/Downloads/HVI Data(Cleaned).json"); // Your converted Excel data
const data = require("C:/Users/owenr/Downloads/HVI +HHI Data(Cleaned) (1).json");
const hviMap = new Map(data.map(obj => {
  const datasets = {"Heat Vulnerability and Hazard Indices": {"HVI": obj.HVI, "HHI": obj.HHI, "HVI + HHI": obj["HVI x HHI"]}}
  return [obj.Code, datasets];
  // ^ Code is the name for the CUSEC in the excel sheet/json
}));
// ^ must manually map each dataset you want added to the table
// ^ the names in quotes are what show up on the website assuming no translation




const admin = require('firebase-admin');

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
console.log("connected!");

const db = admin.firestore();


const HVI_data = {};

// creates a new collection where each table is filed by CUSEC
async function createNewCUSECCollection() {
  const collectionRef = db.collection(collection_name);

  // CUSEC is key
  for(const [key, value] of hviMap) {
    if (!key) {
        console.error("Skipping: document ID is empty or undefined" + key);
        continue; 
    }

    const docRef = collectionRef.doc(key.toString());

    try {
      await docRef.set(value);
      console.log(`✅ Document ${key} created successfully!`);
    } catch (error) {
      console.error("❌ Error seeding document:", error);
    }
  }
}

createNewCUSECCollection();