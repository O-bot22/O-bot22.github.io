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
const upload = require("./generic-json-upload.js");

// Your converted Excel data
// const data = require("C:/Users/owenr/Downloads/Survey Data - For Firebase Upload(Aggregated data for upload).json");
// const data = require("C:/Users/owenr/Downloads/Previous Open Ended Puerto Real Data.xlsx - Database Format.json");
// const data = require('C:/Users/owenr/Downloads/Aggregated Amanda Data - Copy of Copy of Hoja1.json');
const data = require("C:/Users/owenr/Downloads/Previous EP Questions Puerto Real Data.xlsx - Sheet1.json");

// const document_name = "Numerical Data";
// const document_name = "Open Ended Questions";
// const document_name = "IQP Data";
const document_name = "Reasons for Energy Poverty";

const collection_name = "Beneficiary Data";
// const collection_name = "City";



console.log("File loaded");

const admin = require('firebase-admin');

// Tell the script to talk to the EMULATOR, not production
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8888";

admin.initializeApp({ projectId: "puerto-real-energy-poverty" });
const db = admin.firestore();
console.log("connected!");



upload.upload(db, data, document_name, collection_name);