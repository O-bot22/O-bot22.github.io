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


function getColor(d) {
    return d > 20000 ? '#800026' :
           d > 10000 ? '#BD0026' :
                       '#FFEDA0';
}

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

    // now, we can pull the geojson map, and add all the properties from firebase to each of the zones?

    fetch('https://raw.githubusercontent.com/O-bot22/O-bot22.github.io/refs/heads/from_scratch/assets/data/puerto_real_zones.geojson')
    .then(response => 
        response.json()
    )
    .then(geojsonData => {
        console.log(geojsonData);
    
        // Step 1: Create the lookup object
        const incomeLookup = {};
        snapshot.forEach(doc => {
            // console.log(doc.data());
            incomeLookup[doc.id] = doc.data().mediana_renta_unidad_consumo;
        });
        console.log(incomeLookup);

        // Step 2: Use the lookup in your Leaflet layer
        L.geoJson(geojsonData, {
            style: function(feature) {
                // Pull the income from our lookup table using the GeoJSON ID
                const income = incomeLookup[feature.properties.CUSEC];
                
                return {
                    fillColor: getColor(income), // Use your existing color function
                    weight: 1,
                    fillOpacity: 0.7,
                    color: 'white'
                };
            },
            onEachFeature: function(feature, layer) {
                const CUSEC = feature.properties.CUSEC;
                layer.bindTooltip(`CUSEC number: ${CUSEC || 'No Data'} and $${incomeLookup[CUSEC]}`);
            }
        }).addTo(map);
    });

  } catch (error) {
    console.error("Error pulling Firestore data:", error);
  }
}

// Run it!
fetchMyData();
