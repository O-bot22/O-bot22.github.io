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


/**
 * Generates an HSL color along a gradient of a specific hue.
 * @param {number} value - The input number.
 * @param {number} min - The minimum value of the range.
 * @param {number} max - The maximum value of the range.
 * @param {number} hue - The hue angle (0-360).
 * @returns {string} - A CSS HSL color string.
 */
function getHueGradient(value, min, max, hue) {
    // 1. Clamp the value to ensure it stays within the min/max bounds
    // const clamped = Math.max(min, Math.min(max, value));
    
    // 2. Calculate the percentage (0 to 1) of the value within the range
    const range = max - min;
    const percentage = range === 0 ? 0 : (value - min) / range;
    
    // 3. Map the percentage to Lightness (e.g., 90% is light, 30% is dark)
    // Adjust these numbers to change how "light" or "dark" the gradient gets
    const lightness = 90 - (percentage * 60); 
    
    return `hsl(${hue}, 100%, ${lightness}%)`;
}
// could add multi color if needed
/**
 * Maps a value to a color along a multi-stop gradient (RGB).
 */
function getMultiColorGradient(value, min, max, color1, color2, color3) {
    // 1. Normalize the value to a 0-1 scale
    const clamped = Math.max(min, Math.min(max, value));
    const range = max - min;
    let fade = range === 0 ? 0 : (clamped - min) / range;

    let start = color1;
    let end = color2;

    // 2. If we have 3 colors, decide which half of the range we are in
    if (color3) {
        fade = fade * 2; // Split into two 0-1 ranges
        if (fade >= 1) {
            fade -= 1;     // Second half (color2 to color3)
            start = color2;
            end = color3;
        } else {
            // First half (color1 to color2)
            start = color1;
            end = color2;
        }
    }

    // 3. Interpolate the R, G, and B values
    const r = Math.round(start.r + (end.r - start.r) * fade);
    const g = Math.round(start.g + (end.g - start.g) * fade);
    const b = Math.round(start.b + (end.b - start.b) * fade);

    return `rgb(${r}, ${g}, ${b})`;
}
// Example: Red to Yellow to Green
const colors = {
    red:    { r: 255, g: 0,   b: 0 },
    yellow: { r: 255, g: 255, b: 0 },
    green:  { r: 0,   g: 255, b: 0 }
};

// Global Data Selection Variables
let selected_table = "";
let old_table = "";
let selected_CUSEC = null;
let selected_data;
let snapshot;


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

const highlight_color = "#c9ffc9";

const table_name_lookup = {
    "tabla_30945": "Distribución de Fuentes de Ingreso",
    "tabla_30946": "Porcentaje de población con ingresos por unidad de consumo por debajo de determinados umbrales fijos por sexo",
    "tabla_30949": "Porcentaje de población con ingresos por unidad de consumo por debajo/encima de determinados umbrales relativos por sexo",
    "tabla_30952": "Indicadores Demográficos",
    "tabla_37689": "Índice de Gini y Distribución de la renta P80/P20",
    "tabla_66685": "Nivel de formación alcanzado",
    "tabla_69142": "Población por nacionalidad (española/extranjera), edad y sexo",
    "tabla_66687": "Relación con la actividad económica",
    "tabla_30944": "Indicadores de renta media y mediana"
}

function highlightRow(id){
    // get the data name
    if(id){
        // update globally selected data
        selected_data = id.substring(0, id.length - 1);
    }else{
        // if no new element was clicked, highlight the last selected row and arbitrarily start with the number element
        id = selected_data+"#"
    }
    // store which td was clicked
    const e_type = id.substring(id.length - 1, id.length);
    
    // unhighlight all rows
    const row_container = document.getElementById("row_container");
    for(const child of row_container.children) {
        for(const grandchild of child.children){
            grandchild.style.backgroundColor = "white"; // TODO: fix color
        }
    }

    // highlight the selected row
    // change the base element
    const td_element = document.getElementById(id);
    td_element.style.backgroundColor = highlight_color;
    // get the other element of the row
    const other_element = document.getElementById(selected_data + (e_type == "#" ? "i" : "#"));
    other_element.style.backgroundColor = highlight_color;
}

function newDatasetSelectedCallback(e){
    // ! only the td elements are clickable, not the tr !

    highlightRow(e.target.id);

    // redraw the map
    drawHeatmap()
}

function generate_selected_table(){
    // check that a neighborhood has been selected
    if(! selected_CUSEC){
        console.log("please select a neighborhood");
        return
    }

    // clear old rows
    const row_container = document.getElementById("row_container");
    row_container.innerHTML = "";

    // pull new names
    const dataset_names = Object.keys(snapshot.docs[0].data()["datasets"][selected_table]); // can be pulled from any neighborhood as long as we have data for them all
    // TODO: add failsafe for when we do not have data for a specific neighborhood
    
    // generate a row for each name
    dataset_names.forEach(name => {
        // each name needs an identifier column element and a number column element and a unit?
        const row = document.createElement("tr");
        const identifier = document.createElement("td");
        const number = document.createElement("td");

        // fill columns
        // every id must be different, so append an i or #, so that it can later be pulled to redraw the heatmap
        identifier.innerHTML = name.replaceAll("_", " ");
        identifier.id = name+"i";
        number.innerHTML = formatData(dataLookup[selected_CUSEC]["datasets"][selected_table][name], name);
        number.id = name+"#";

        // add event listener so that each box can update the map
        // adding it to the row gives it to all columns
        row.addEventListener("click", newDatasetSelectedCallback);

        // add to container
        row.appendChild(identifier);
        row.appendChild(number);
        row_container.appendChild(row);
    });

    // if we switched tables, highlight the first heatmap and redraw it
    if(old_table != selected_table){
        highlightRow(dataset_names[0]+"i");
        old_table = selected_table;
        drawHeatmap();
    }
}

// global map variables
let mapLayer;
let geoJSON;

function drawHeatmap(){
    // Create the lookup object
    // call an update function so that it can be used globally
    updateDocLookup();

    // remove the layer from the map so that it can be re added
    if(! mapLayer){
        console.log("no map layer has been made yet");
    }else{
        mapLayer.remove();
    }

    // pull the statistic for each neighborhood to get max and min numbers
    // store each value in an array for processing at the end
    const stat_dump = [];
    Object.entries(dataLookup).forEach(data => {
        if(data[0] == "_query" || data[0] == "_readTime"){
            return
        }
        try {
            stat_dump.push(data[1]["datasets"][selected_table][selected_data]);
        } catch (error){ 
            console.log("CUSEC: "+data[0]);
            console.error("Error pulling neighborhood data:", error);
        }
    })
    // console.log("pulled for all entries");

    const max = Math.max(...stat_dump);
    const min = Math.min(...stat_dump);
    // console.log("Max:\t"+max+"\nMin:\t"+min);

    // Use the lookup in your Leaflet layer
    mapLayer = L.geoJson(geoJSON, {
        style: function(feature) {
            // Pull the income from our lookup table using the GeoJSON ID
            // check that a dataset has been selected already
            let statistic;
            if(selected_data){
                // pull the selected statistic for that CUSEC to be used for color generation
                statistic = dataLookup[feature.properties.CUSEC]["datasets"][selected_table][selected_data];
            }
            return {
                fillColor: getHueGradient(statistic, max, min, 200), // TODO: get rid of magic number for color
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
                generate_selected_table();

                // TODO: somehow keep the same row highlighted when a new CUSEC is picked without redrawing the whole table
                highlightRow();
            });
        }
    }).addTo(map);

    // update the legend
    const left_box = document.getElementById("L");
    const right_box = document.getElementById("R");

    left_box.style = "background-color: " + getHueGradient(min, max, min, 200);
    right_box.style = "background-color: " + getHueGradient(max, max, min, 200);

    const left_label = document.getElementById("left-label");
    const right_label = document.getElementById("right-label");
    left_label.innerHTML = formatData(min, selected_data);
    right_label.innerHTML = formatData(max, selected_data);
}

async function fetchMyData() {
  try {
    console.log("connecting to database...");
    const colRef = collection(db, "Zones");
    console.log("database connected !");

    // store the firebase response globally
    snapshot = await getDocs(colRef);

    console.log("data recieved!");
    
    if (snapshot.empty) {
      console.log("No documents found.");
      return;
    }

    // generate a dropdown to put all of the statistics
    const dropdown = document.getElementById("statistics");
    function update_tablename(e){
        selected_table = e.target.value;
        generate_selected_table();
    }
    dropdown.addEventListener("click", update_tablename);
    
    const table_names = Object.keys(snapshot.docs[0].data()["datasets"]); // can be pulled from any dataset, so the first is used
    table_names.forEach((name) => {
        var dropdown_element = document.createElement("option");
        if(table_name_lookup[name]){
            dropdown_element.innerHTML = table_name_lookup[name]; // print a human readable tablename
        }else{
            dropdown_element.innerHTML = name;
        }
        dropdown_element.value = name;
        dropdown.appendChild(dropdown_element);
    });

    // set the default table name so that the dataset names can be pulled
    selected_table = table_names[0];

    // now, we can pull the geojson map, and add all the properties from firebase to each of the zones

    fetch('https://raw.githubusercontent.com/O-bot22/O-bot22.github.io/refs/heads/from_scratch/assets/data/puerto_real_zones.geojson')
    .then(response => 
        response.json()
    )
    .then(geojsonData => {
        // store globally for redrawing
        geoJSON = geojsonData;
        // draw for the first time
        drawHeatmap();
    });

  } catch (error) {
    console.error("Error pulling Firestore data:", error);
  }
}

// Run it!
fetchMyData();
