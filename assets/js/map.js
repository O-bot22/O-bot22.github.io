/**
 * TODO:
 * add data from Amanda (district level ideally)
 * add polygon for whole city
 * add sources on the site so readers can find out citations
 * possibly refactor into multiple js files for maintainability
 * add support for multiple amanda tables
 */


import { db, collection, getDocs, connectFirestoreEmulator, query, where } from './firebase_config.js';
import { getHueGradient, getMultiColorGradient, highlight_color, hover_color, selected_color, left_color, middle_color, right_color, gradient_opacity } from './map-style.js';
import { formatData } from './format.js';


// Get language from URL
const params = new URLSearchParams(window.location.search);
const lang = params.get("lang") || "en";
// can be set with /map/?lang=es

// pull translation file and store globally
const res = await fetch(`/lang/${lang}.json`);
let translations = await res.json();
// documentname translation file
const documents_res = await fetch('/lang/datasets-'+lang+'.json');
let dataset_translations = await documents_res.json();


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
    connectFirestoreEmulator(db, 'localhost', 8888);
}

// console.log("firebase imported!");


// Global Data Selection Variables
let selected_document = "";
let old_document = "";
let selected_CUSEC = null;
let selected_data = null;
let aggregated = false;

let snapshot;
let document_names;
let amanda_snapshot;
const amanda_label = "Demographics of Beneficiaries";
let amandaLookup = {};


const dataLookup = {};  // to store firebase data
const averages = {};    // to store aggregated data
function updateDocLookup(){
    snapshot.forEach(doc => {
        dataLookup[doc.id] = doc.data();
    });
}



let document_name_lookup;
// maybe it should just be in spanish, since the data was published in spanish and the datanames are in spanish?
// TODO: move this to a json
if(lang == "es"){
    document_name_lookup = {
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
    document_name_lookup = {
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

    console.log("clicked on dataset: "+e.target.id);

    // redraw the map
    drawHeatmap();
    // TODO: make sure when the heatmap is redrawn, the same neighborhood is still highlighted
}

function generate_selected_table(){
    // TODO: if showing aggregated data, then add it so it can be shown, no matter what CUSEC is selected

    // check that a neighborhood has been selected
    if(! selected_CUSEC && ! aggregated){
        console.log("please select a neighborhood");
        return
    }

    // clear old rows
    const row_container = document.getElementById("row_container");
    row_container.innerHTML = "";

    // pull new names
    let dataset_names;
    console.log(selected_document);
    if(aggregated && selected_document == amanda_label){
        dataset_names = Object.keys(amanda_snapshot.docs[0].data());
    }else{
        dataset_names = Object.keys(snapshot.docs[0].data()["datasets"][selected_document]); // can be pulled from any neighborhood as long as we have data for them all
    }
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
            // if no translation is found, just print the raw name with underscores replaced with spaces, which is more readable at least and capitalize the first letter of the first word
            let formatted_name = name.charAt(0).toUpperCase() + name.slice(1);
            formatted_name = formatted_name.replaceAll("_", " ");
            identifier.innerHTML = formatted_name;
        }
        identifier.id = name+"i";
        if(aggregated){
            if(selected_document == amanda_label){
                console.log(amanda_snapshot.docs[0].data()[name]);
                number.innerHTML = formatData(amanda_snapshot.docs[0].data()[name], name, selected_document);
            }else{
                number.innerHTML = formatData(averages[selected_document][name], name, selected_document);
            }
        }else{
            try{
                number.innerHTML = formatData(dataLookup[selected_CUSEC]["datasets"][selected_document][name], name, selected_document);
            }catch(e){
                console.log(selected_CUSEC);
                console.log(e);
            }
        }
        number.id = name+"#";

        // add event listener so that each box can update the map
        // adding it to the row gives it to all columns
        row.addEventListener("click", newDatasetSelectedCallback);

        // add to container
        row.appendChild(identifier);
        row.appendChild(number);
        row_container.appendChild(row);
    });

    // if we switched documents, highlight the first heatmap and redraw it
    if(old_document != selected_document){
        highlightRow(dataset_names[0]+"i");
        old_document = selected_document;
        drawHeatmap();
    }
}

// global map variables
let mapLayer;
let geoJSON;

function clearPopups(topLayer){
    mapLayer.eachLayer(function(l) {
        if(l != topLayer){
            l.closePopup();
        }
    });
}
function clearHighlights(topLayer){
    mapLayer.eachLayer(function(l) {
        if(l != topLayer){
            // clear borders
            l.setStyle({ weight: 0});
        }
    });
}
// used to generate the style for each GeoJSON polygon that is added to the heatmap
function stylePolygon(feature, min, max) {
    // Pull the income from our lookup table using the GeoJSON ID
    // check that a dataset has been selected already
    let statistic;
    if(selected_data){
        // pull the selected statistic for that CUSEC to be used for color generation
        // HACK: needs to be diff for amanda data
        if(selected_document == amanda_label){
            statistic = amandaLookup[selected_data];
        }else{
            statistic = dataLookup[feature.properties.CUSEC]["datasets"][selected_document][selected_data];
        }
    }

    // fill with a standard color when showing aggregate data
    let f = 0;
    if(aggregated){
        f = right_color;
    }else{
        f = getMultiColorGradient(statistic, min, max, left_color, middle_color, right_color);
    } 
    return {
        fillColor: f,
        weight: 0,
        fillOpacity: 0.7,
        color: 'white'
    };
}
function onZoneSelected(layer, CUSEC){
    // unhighlight all other popups
    clearHighlights(layer);

    // highlight the selected neighborhood
    layer.setStyle({ weight: 5, color: selected_color, dashArray: '', fillOpacity: 0.7 });
    layer.bringToFront(); // Ensures the border highlight is visible above other layers

    // update the Statistics Sidebar
    // CUSEC number
    const cusec_element = document.getElementById("CUSEC");
    if(aggregated){
        cusec_element.innerHTML = "---";
    }else{                
        cusec_element.innerHTML = CUSEC;
    }
    selected_CUSEC = CUSEC;

    // generate table row for each stat
    generate_selected_table(); // <- this breaks the first time a zone is selected

    // keep the same row highlighted when a new CUSEC is picked without redrawing the whole table
    highlightRow();
};
function onZoneMouseover(layer, CUSEC) {
    // close all other popups
    clearPopups(layer);

    // show the selected popup
    layer.openPopup();
    
    // check if a dataset has been selected, if not just show the CUSEC?
    if(selected_data){
        let display_name = dataset_translations[selected_data.replaceAll("_", " ")] || selected_data.replaceAll("_", " ");
        // always capitalize first letter of the display name for better formatting, since some of the dataset names are all lowercase
        display_name = display_name.charAt(0).toUpperCase() + display_name.slice(1);
        
        layer.bindPopup("CUSEC: " + CUSEC + "<br>"+display_name+": " + formatData(dataLookup[CUSEC]["datasets"][selected_document][selected_data], selected_data, selected_document), {
            closeButton: false, 
            offset: L.point(0, -10) // Prevents popup from flickering under the cursor
        });
    }

    // unhighlight all other popups except the currently selected one
    mapLayer.eachLayer(function(l) {
        if(l.feature.properties.CUSEC == selected_CUSEC){
            console.log(selected_CUSEC + "is the selected CUSEC");
            l.setStyle({ weight: 5, color: selected_color, dashArray: '', fillOpacity: gradient_opacity });
        }
        if(l != layer && l.feature.properties.CUSEC != selected_CUSEC){
            // clear borders
            l.setStyle({ weight: 0 });
        }
    });

    // light highlight the selected neighborhood
    layer.setStyle({ weight: 5, color: hover_color, dashArray: '', fillOpacity: gradient_opacity });
    layer.bringToFront(); // Ensures the border highlight is visible above other layers
}

function onZoneClicked(feature, layer) {
    const CUSEC = feature.properties.CUSEC;

    // Popup appears on click by default
    layer.bindPopup(CUSEC, {
        closeButton: false, 
        offset: L.point(0, -10) // Prevents popup from flickering under the cursor
    });
    
    // make the polygon static if the aggregate data is being displayed
    if(aggregated){
        return
    }

    // otherwise enable highlighs on click and mouseover
    layer.on('click', (e) => {onZoneSelected(layer, CUSEC)});
    layer.on('mouseover', (e) => {onZoneMouseover(layer, CUSEC)});
}

function drawHeatmap(){
    // if aggregated is true, draw all of Puerto Real as a connected region

    // Create the lookup object
    // call an update function so that it can be used globally
    updateDocLookup();

    // remove the layer from the map so that it can be re added
    if(mapLayer){
        mapLayer.remove();
    }

    // pull the statistic for each neighborhood to get max and min numbers
    // store each value in an array for processing at the end
    const stat_dump = [];
    Object.entries(dataLookup).forEach(data => {
        // filter out metadata
        if(data[0] == "_query" || data[0] == "_readTime"){
            return
        }

        try {
            // HACK: should maybe make a selected collection level to avoid this. Especially since the amanda data does not have a min or max rn
            if(selected_document == amanda_label){
                stat_dump.push(amanda_snapshot.docs[0].data()[selected_data]);
            }else{
                stat_dump.push(data[1]["datasets"][selected_document][selected_data]);
            }
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
    // console.log(" drawing map layer...");
    mapLayer = L.geoJson(geoJSON, {
        style: feature => stylePolygon(feature, min, max),
        onEachFeature: onZoneClicked
    }).addTo(map);

    // update the legend
    const left_box = document.getElementById("L");
    const right_box = document.getElementById("R");

    left_box.style = "background-color: " + left_color + "; opacity: " + gradient_opacity;
    right_box.style = "background-color: " + right_color + "; opacity: " + gradient_opacity;

    const left_label = document.getElementById("left-label");
    const right_label = document.getElementById("right-label");
    if(selected_data){
        left_label.innerHTML = formatData(min, selected_data, selected_document);
        right_label.innerHTML = formatData(max, selected_data, selected_document);
    }else{
        // No dataset has been selected yet, cannot make a legend
        left_label.innerHTML = "N/A";
        right_label.innerHTML = "N/A";
    }
}

function generateDropdownOptions(){
    const dropdown = document.getElementById("statistics");

    // clear old options (if there are any)
    dropdown.innerHTML = "";

    document_names.forEach((name) => {
        var dropdown_element = document.createElement("option");
        if(document_name_lookup[name]){
            dropdown_element.innerHTML = document_name_lookup[name]; // print a human readable documentname
        }else{
            dropdown_element.innerHTML = name;
        }
        dropdown_element.value = name;
        dropdown.appendChild(dropdown_element);
    });

    // set the default document name so that the dataset names can be pulled
    selected_document = document_names[0];
}
function calculateAggregateData(){
    const docs = snapshot.docs;
    // look in each document for each statistic for each document
    document_names.forEach((document_name) => {
        // console.log(document_name);
        const stat_names = Object.keys(docs[0].data()["datasets"][document_name]);
        // console.log(stat_names);
        averages[document_name] = {};
        stat_names.forEach(stat_name => {
            // console.log(stat_name);
            averages[document_name][stat_name] = 0;
            docs.forEach(doc => {
                try{
                    averages[document_name][stat_name] += doc.data()["datasets"][document_name][stat_name];
                    // console.log(doc.data()["datasets"][document_name][stat_name]);
                } catch (error){
                    // console.log("doc at the end");
                }
            });
            const l = docs.length - 2;
            // console.log(l); // should be number of zones
            averages[document_name][stat_name] = (averages[document_name][stat_name]/l).toFixed(2);
        });
    });
}

async function fetchZoneData() {
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
    function update_documentname(e){
        // this breaks because Owen decided to add data messily
        // clean up manually maybe
        // if(e.target.value == amanda_label){
        //     selected_document = 
        // }else{
        selected_document = e.target.value;
        // }
        generate_selected_table();
    }
    dropdown.addEventListener("click", update_documentname);

    // store document names from snapshot
    document_names = Object.keys(snapshot.docs[0].data()["datasets"]); // can be pulled from any dataset, so the first is used

    generateDropdownOptions();

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

    // calculate average data
    // TODO: use weighted average instead
    calculateAggregateData();

  } catch (error) {
    console.error("Error pulling Firestore data:", error);
  }
}

async function fetchAggregateData() {
    try{
        const colRef = collection(db, "Amanda");

        // store the firebase response globally
        amanda_snapshot = await getDocs(colRef);

        if (amanda_snapshot.empty) {
            console.log("No documents found.");
            return;
        }

        amandaLookup = amanda_snapshot.docs[0].data();
        console.log(amanda_snapshot.docs[0].data());
    } catch (error) {
        console.error("Error pulling Firestore data:", error);
    }
}

// Run it!
fetchZoneData();
fetchAggregateData();

const toggle_switch = document.getElementById("toggle");
toggle_switch.addEventListener("change", (e) => {
    aggregated = e.target.checked;
    const cusec_element = document.getElementById("CUSEC");
    
    // switch to view of aggregated data for the whole city or
    // reset to display section-specific data
    drawHeatmap();

    if(aggregated){
        document_names.push(amanda_label);
        cusec_element.innerHTML = "---";
    }else{    
        document_names.pop(amanda_label);
        cusec_element.innerHTML = selected_CUSEC;
    }

    generateDropdownOptions();
    generate_selected_table();
    // TODO: can I use onZoneSelected here?
})
