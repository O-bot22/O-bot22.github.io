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
    layers: [osmHOT]
});



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
let selected_CUSEC = null;
let snapshot;

// function generate_dataset_dropdown(){
//     if(! snapshot){
//         console.log("Firebase not pulled yet!");
//         return;
//     }

//     const dataset_dropdown = document.getElementById("dataset");
    
//     // const table_names = Object.keys(snapshot.docs[0].data()["datasets"]);
//     const dataset_names = Object.keys(snapshot.docs[0].data()["datasets"][dataset_table]);

//     dataset_dropdown.innerHTML = "";
//     dataset_names.forEach(name => {
//         var dropdown_element = document.createElement("option");
//         dropdown_element.innerHTML = name.replaceAll("_", " ");
//         dropdown_element.value = name;
//         dataset_dropdown.appendChild(dropdown_element);
//     });

//     // update selected dataset name to the default
//     dataset_name = dataset_names[0];
// }


const dataLookup = {};
function updateDocLookup(){
    snapshot.forEach(doc => {
        dataLookup[doc.id] = doc.data();
    });
}

function formatData(number, dataset_name){
    // TODO: fill this out
    let pre = "";
    let post = "";
    if(dataset_name.includes("fuente_de_ingreso")){
        post = "%";
    }else if(dataset_name.includes("fuente_de_ingreso")){
        // TODO: for long numbers add in commas
    }else if(dataset_name.includes("Porcentaje")){
        post = "%";
    }else if(dataset_name.includes("poblacion")){
        post = "%";
    }
    return pre + number + post;
}

function generate_dataset_table(){
    // check a neighborhood has been selected
    if(! selected_CUSEC){
        console.log("please select a neighborhood");
        return
    }

    // clear old rows
    const row_container = document.getElementById("row_container");
    row_container.innerHTML = "";

    // pull new names
    const dataset_names = Object.keys(snapshot.docs[0].data()["datasets"][dataset_table]); // can be pulled from any neighborhood as long as we have data for them all
    // TODO: add failsafe for when we do not have data for a specific neighborhood
    
    // generate a row for each name
    dataset_names.forEach(name => {
        // each name needs an identifier column element and a number column element and a unit
        const row = document.createElement("tr");
        const identifier = document.createElement("td");
        const number = document.createElement("td");

        // fill columns
        identifier.innerHTML = name.replaceAll("_", " ");
        number.innerHTML = formatData(dataLookup[selected_CUSEC]["datasets"][dataset_table][name], name);

        // add to container
        row.appendChild(identifier);
        row.appendChild(number);
        row_container.appendChild(row);
    });
}


async function fetchMyData() {
  try {
    console.log("connecting to database...");
    const colRef = collection(db, "Zones");
    console.log("database connected !");

    snapshot = await getDocs(colRef);

    console.log("data recieved!");
    
    if (snapshot.empty) {
      console.log("No documents found.");
      return;
    }

    // generate a dropdown to put all of the statistics
    const dropdown = document.getElementById("statistics");
    function update_tablename(e){
        dataset_table = e.target.value;
        generate_dataset_table();
    }
    dropdown.addEventListener("click", update_tablename);
    
    const table_names = Object.keys(snapshot.docs[0].data()["datasets"]); // can be pulled from any dataset, so the first is used
    table_names.forEach((name) => {
        var dropdown_element = document.createElement("option");
        dropdown_element.innerHTML = name.replaceAll("_", " ");
        dropdown_element.value = name;
        dropdown.appendChild(dropdown_element);
    });

    // set the default table name so that the dataset names can be pulled
    dataset_table = table_names[0];

    generate_dataset_table();

    // now, we can pull the geojson map, and add all the properties from firebase to each of the zones

    fetch('https://raw.githubusercontent.com/O-bot22/O-bot22.github.io/refs/heads/from_scratch/assets/data/puerto_real_zones.geojson')
    .then(response => 
        response.json()
    )
    .then(geojsonData => {
        // Step 1: Create the lookup object
        // call an update function so that it can be used globally
        updateDocLookup();

        // Step 2: Use the lookup in your Leaflet layer
        L.geoJson(geojsonData, {
            style: function(feature) {
                // Pull the income from our lookup table using the GeoJSON ID
                const income = dataLookup[feature.properties.CUSEC]["datasets"]["tabla_30944"]["Media de la renta por unidad de consumo"];
                return {
                    fillColor: getColor(income), // Use your existing color function
                    weight: 1,
                    fillOpacity: 0.7,
                    color: 'white'
                };
            },
            onEachFeature: function(feature, layer) {
                const CUSEC = feature.properties.CUSEC;
                
                layer.on('click', function(e) {
                    // update the Statistics Sidebar
                    // CUSEC number
                    const cusec_element = document.getElementById("CUSEC");
                    cusec_element.innerHTML = CUSEC;
                    selected_CUSEC = CUSEC;

                    // generate table row for each stat
                    generate_dataset_table();
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
