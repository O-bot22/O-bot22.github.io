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

// Global Data Selection Variables
let dataset_table = "";
let dataset_name = "";


async function fetchMyData() {
  try {
    console.log("connecting to database...");
    const colRef = collection(db, "Zones");
    console.log("database connected !");

    const snapshot = await getDocs(colRef);

    console.log("data recieved!");
    
    if (snapshot.empty) {
      console.log("No documents found.");
      return;
    }

    // generate a dropdown to put all of the statistics
    const dropdown = document.getElementById("statistics");
    
    const table_names = Object.keys(snapshot.docs[0].data()["datasets"]);
    
    table_names.forEach((pair) => {
        var dropdown_element = document.createElement("option");
        dropdown_element.innerHTML = pair;
        dropdown_element.value = pair;
        dropdown.appendChild(dropdown_element);
    });

    const dataset_dropdown = document.getElementById("dataset");

    const dataset_names = Object.keys(snapshot.docs[0].data()["datasets"][table_names[0]]);
    
    dataset_names.forEach(name => {
        var dropdown_element = document.createElement("option");
        dropdown_element.innerHTML = name;
        dropdown_element.value = name;
        dataset_dropdown.appendChild(dropdown_element);
    });

    // now, we can pull the geojson map, and add all the properties from firebase to each of the zones

    fetch('https://raw.githubusercontent.com/O-bot22/O-bot22.github.io/refs/heads/from_scratch/assets/data/puerto_real_zones.geojson')
    .then(response => 
        response.json()
    )
    .then(geojsonData => {
        // Step 1: Create the lookup object
        const incomeLookup = {};
        snapshot.forEach(doc => {
            incomeLookup[doc.id] = doc.data();
        });

        // Step 2: Use the lookup in your Leaflet layer
        L.geoJson(geojsonData, {
            style: function(feature) {
                // Pull the income from our lookup table using the GeoJSON ID
                const income = incomeLookup[feature.properties.CUSEC]["datasets"]["tabla_30944"]["Media de la renta por unidad de consumo"];
                // console.log(income);
                
                return {
                    fillColor: getColor(income), // Use your existing color function
                    weight: 1,
                    fillOpacity: 0.7,
                    color: 'white'
                };
            },
            onEachFeature: function(feature, layer) {
                const CUSEC = feature.properties.CUSEC;
                
                // register the basic, built in leaflet popup
                // layer.bindTooltip(`CUSEC number: ${CUSEC || 'No Data'} and $${incomeLookup[feature.properties.CUSEC]["datasets"]["tabla_30944"]["Media de la renta por unidad de consumo"]}`);

                layer.on('click', function(e) {
                    // Access properties of the clicked polygon
                    // alert("You clicked on " + CUSEC);
                    
                    // update the Statistics Sidebar
                    let number = document.getElementById("stat_number");
                    number.innerHTML = CUSEC;
                });
            }
        }).addTo(map);
    });

  } catch (error) {
    console.error("Error pulling Firestore data:", error);
  }
}

// Run it!
fetchMyData();

1
// connect to Statistics Sidebar
let number = document.getElementById("stat_number");
number.innerHTML = "ff";