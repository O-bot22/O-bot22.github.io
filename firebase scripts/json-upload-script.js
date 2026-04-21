/**
 * Used to upload JSON files to any collection
 * From an google sheet, first export as a CSV
 * next, use an online csv to json converter
 * finally, point to the file here
 * 
 * -> Service account credentials must be created in the Firestore portal under Setting -> Service Accounts
 * -> make sure to use a new collection name to avoid overwriting data
 */
const upload = require("./generic-json-upload.js");



const data = require("C:/Users/owenr/Downloads/Survey Data - For Firebase Upload(Aggregated data for upload).json");
// const data = require("C:/Users/owenr/Downloads/Previous Open Ended Puerto Real Data.xlsx - Database Format.json");
// const data = require('C:/Users/owenr/Downloads/Aggregated Amanda Data - Copy of Copy of Hoja1.json');

// const document_name = "Numerical Data";
// const document_name = "Open Ended Questions";
const document_name = "IQP Data";

// const collection_name = "Beneficiary Data";
const collection_name = "City";



const admin = require('firebase-admin');
const serviceAccount = require('C:/Users/owenr/Downloads/puerto-real-energy-poverty-firebase-adminsdk-fbsvc-261b0de29f.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();


upload.upload(db, data, document_name, collection_name);