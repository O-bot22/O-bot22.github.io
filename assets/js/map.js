import { db, collection, getDocs, connectFirestoreEmulator, query, where } from './firebase_config.js';

// Style Constants

const highlight_color = "#c9ffc9";
const gradient_hue = 200;
const hover_color = "#66ff66";


// Get language from URL
const params = new URLSearchParams(window.location.search);
const lang = params.get("lang") || "en";
// can be set with /map/?lang=es

// pull translation file and store globally
const res = await fetch(`/lang/${lang}.json`);
let translations = await res.json();
// tablename translation file
const tables_res = await fetch('/lang/datasets-'+lang+'.json');
let dataset_translations = await tables_res.json();


// Load Background Map

// base map
var osmHOT = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: translations["Map Attribution"]}
);

// create map instance centered around Puerto Real with the map layers
var map = L.map('map', {
    center: [36.531517590929056, -6.190161615515397],
    zoom: 14,
    layers: [osmHOT]
});


// Set up firebase

// Check if running locally
// console.log(location.hostname);
if (location.hostname === "127.0.0.1") {
    // console.log("connecting to emulator...")
    // 8080 is the default Firestore emulator port
    connectFirestoreEmulator(db, 'localhost', 8888);
}

// console.log("firebase imported!");


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
    try{
        if(dataset_name.includes("fuente_de_ingreso")){
            post = "%";
        }else if(dataset_name.includes("fuente_de_ingreso")){
            // TODO: for long numbers add in commas
        }else if(dataset_name.includes("Porcentaje")){
            post = "%";
        }else if(dataset_name.includes("poblacion")){
            post = "%";
        }
    } catch (e){
        console.log(dataset_name);
        console.log(e);
    };
    return pre + number + post;
}

let table_name_lookup;
// maybe it should just be in spanish, since the data was published in spanish and the datanames are in spanish?
if(lang == "es"){
    table_name_lookup = {
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
}else{
    table_name_lookup = {
        "tabla_30945": "Distribution of Sources of Income",
        "tabla_30946": "Percentage of population with income per consumption unit below certain fixed thresholds by sex",
        "tabla_30949": "Percentage of population with income per consumption unit below/above certain relative thresholds by sex",
        "tabla_30952": "Demographic Indicators",
        "tabla_37689": "Gini Index and Income Distribution (P80/P20)",
        "tabla_66685": "Level of Education Attained",
        "tabla_69142": "Population by Nationality (Spanish/Foreign), Age, and Sex",
        "tabla_66687": "Relationship with Economic Activity",
        "tabla_30944": "Indicators of Average and Median Income"
    }
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
    drawHeatmap();
    // TODO: make sure when the heatmap is redrawn, the same neighborhood is still highlighted
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
        // translate name to proper language
        const translated_name = dataset_translations[name.replaceAll("_", " ")];
        if(translated_name){
            identifier.innerHTML = translated_name;
        }else{
            identifier.innerHTML = name.replaceAll("_", " ");
        }
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
        // console.log("no map layer has been made yet");
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

    // Use the lookup in the Leaflet layer
    console.log(" drawing map layer...");
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
                fillColor: getHueGradient(statistic, min, max, gradient_hue),
                weight: 1,
                fillOpacity: 0.7,
                color: 'white'
            };
        },
        onEachFeature: function(feature, layer) {
            const CUSEC = feature.properties.CUSEC;

            // Check if the feature has properties and a specific field (e.g., 'name')
            // if (feature.properties && feature.properties.name) {
            layer.bindPopup(CUSEC, {
                closeButton: false, 
                offset: L.point(0, -10) // Prevents popup from flickering under the cursor
            });
            // ^ appears on click by default
            
            layer.on('click', function(e) {
                // unhighlight all other popups
                mapLayer.eachLayer(function(l) {
                    if(l != layer){
                        l.setStyle({ weight: 1, color: 'white', dashArray: '', fillOpacity: 0.7 });
                    }
                });

                // highlight the selected neighborhood
                // var layer = e.target;
                layer.setStyle({ weight: 5, color: '#666', dashArray: '', fillOpacity: 0.7 });
                layer.bringToFront(); // Ensures the border highlight is visible above other layers

                // update the Statistics Sidebar
                // CUSEC number
                const cusec_element = document.getElementById("CUSEC");
                cusec_element.innerHTML = CUSEC;
                selected_CUSEC = CUSEC;

                // generate table row for each stat
                generate_selected_table();

                // keep the same row highlighted when a new CUSEC is picked without redrawing the whole table
                highlightRow();
            });

            layer.on('mouseover', function(e) {
                // close all other popups
                mapLayer.eachLayer(function(l) {
                    if(l != layer){
                        l.closePopup();
                    }
                });

                // show the selected popup
                layer.openPopup();
                // TODO: get the display name of the tables and stats to show in the popup instead of just the raw data name, which is not very user friendly
                const display_name = dataset_translations[selected_data.replaceAll("_", " ")] || selected_data.replaceAll("_", " ");
                
                layer.bindPopup("CUSEC: " + CUSEC + "<br>"+display_name+": " + formatData(dataLookup[CUSEC]["datasets"][selected_table][selected_data], selected_data), {
                    closeButton: false, 
                    offset: L.point(0, -10) // Prevents popup from flickering under the cursor
                });

                // unhighlight all other popups except the currently selected one
                mapLayer.eachLayer(function(l) {
                    if(l.feature.properties.CUSEC == selected_CUSEC){
                        console.log(selected_CUSEC + "is the selected CUSEC");
                    }
                    if(l != layer && l.feature.properties.CUSEC != selected_CUSEC){
                        l.setStyle({ weight: 1, color: 'white', dashArray: '', fillOpacity: 0.7 });
                    }
                });

                // light highlight the selected neighborhood
                // var layer = e.target;
                layer.setStyle({ weight: 5, color: hover_color, dashArray: '', fillOpacity: 0.7 });
                layer.bringToFront(); // Ensures the border highlight is visible above other layers
            });

            // layer.on('mouseout', function(e){
            //     // unhighlight the neighborhood when the mouse leaves, but only if it is not the currently selected neighborhood
            //     if(selected_CUSEC == CUSEC){
            //         return
            //     }
            //     var layer = e.target;
            //     layer.setStyle({ weight: 1, color: 'white', dashArray: '', fillOpacity: 0.7 });
            //     layer.bringToFront(); // Ensures the border highlight is visible above other layers
                
            //     layer.closePopup();
            // });
        }
    }).addTo(map);

    // update the legend
    const left_box = document.getElementById("L");
    const right_box = document.getElementById("R");

    left_box.style = "background-color: " + getHueGradient(min, min, max, gradient_hue);
    right_box.style = "background-color: " + getHueGradient(max, min, max, gradient_hue);

    const left_label = document.getElementById("left-label");
    const right_label = document.getElementById("right-label");
    if(selected_data){
        left_label.innerHTML = formatData(min, selected_data);
        right_label.innerHTML = formatData(max, selected_data);
    }else{
        // No dataset has been selected yet, cannot make a legend
        left_label.innerHTML = "N/A";
        right_label.innerHTML = "N/A";
    }
}

async function fetchMyData() {
  try {
    // console.log("connecting to database...");
    const colRef = collection(db, "Zones");
    // console.log("database connected !");

    // store the firebase response globally
    snapshot = await getDocs(colRef);

    // console.log("data recieved!");
    
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

// Fill in page for the selected language
changeLanguage(lang);

async function changeLanguage(lang) {
    // update the global translation variable
    const res = await fetch(`/lang/${lang}.json`);
    translations = await res.json();

    let title_div = document.getElementById("page-title");
    title_div.children[0].innerText = translations["Map Title"];
    
    // do this dynamically
    let elems = document.getElementsByClassName("translatable");
    Array.from(elems).forEach(elem => {
        elem.innerHTML = translations[elem.id];
    });
}