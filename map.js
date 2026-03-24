// create points
var littleton = L.marker([36.51, -6.19]).bindPopup('This is Littleton, CO.'),
    denver    = L.marker([36.54, -6.19]).bindPopup('This is Denver, CO.'),
    aurora    = L.marker([36.53, -6.19]).bindPopup('This is Aurora, CO.'),
    golden    = L.marker([36.57, -6.19]).bindPopup('This is Golden, CO.');
var cities = L.layerGroup([littleton, denver, aurora, golden]);


// create base map layer
var osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
});

// other optional other base map
var osmHOT = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors, Tiles style by Humanitarian OpenStreetMap Team hosted by OpenStreetMap France'}
);


// create map instance centered around Puerto Real with the map layers
var map = L.map('map', {
    center: [36.531517590929056, -6.190161615515397],
    zoom: 14,
    layers: [osm]
});


// these labels are what go in the legend
var baseMaps = {
    "OpenStreetMap": osm,
    "<span style='color: red'>OpenStreetMap.HOT</span>": osmHOT
};

// Set up firebase

import { db, collection, getDocs, connectFirestoreEmulator, query, where } from './firebase_config.js';

// Check if you are running locally
console.log(location.hostname);
if (location.hostname === "127.0.0.1") {
    console.log("connecting to emulator...")
    // 8080 is the default Firestore emulator port
    connectFirestoreEmulator(db, 'localhost', 8888);
}

console.log("firebase imported!");


async function fetchMyData() {
  try {
    console.log("fetching data...")
    const colRef = collection(db, "Zones");
    console.log(colRef);

    // const q = query(colRef, where("status", "==", "active"));
    // const snapshot = await getDocs(q);

    const snapshot = await getDocs(colRef);

    console.log("recieved data?")
    
    if (snapshot.empty) {
      console.log("No documents found.");
      return;
    }

    snapshot.forEach(doc => {
      console.log("ID:", doc.id, "Data:", doc.data());
    });
  } catch (error) {
    console.error("Error pulling Firestore data:", error);
  }
}

// Run it!
fetchMyData();


  
fetch('https://raw.githubusercontent.com/O-bot22/O-bot22.github.io/refs/heads/from_scratch/assets/data/puerto_real_zones.geojson')
    .then(response => 
        response.json()
    )
    .then(data => {
        console.log(data);
        var income_layer = L.geoJSON(data);
        income_layer.addTo(map);

        var overlayMaps = {
            "Cities": cities,
            "Income?": income_layer
        };

        // add the legend object to the map instance
        var layerControl = L.control.layers(baseMaps, overlayMaps).addTo(map);
    });

// Import the functions you need from the SDKs you need
// import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
// import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-analytics.js";
// import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-lite.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries


// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// const firebaseConfig = {
//     apiKey: "AIzaSyAdZjIs5nGclyE2imP6i3IDMLSTZa5Ll6s",
//     authDomain: "puerto-real-energy-poverty.firebaseapp.com",
//     projectId: "puerto-real-energy-poverty",
//     storageBucket: "puerto-real-energy-poverty.firebasestorage.app",
//     messagingSenderId: "771763485796",
//     appId: "1:771763485796:web:17a4dc2efc6231240ef371",
//     measurementId: "G-8K571D71ED"
// };

// const app = initializeApp(firebaseConfig);

