/**
 * TODO:
 * add sources on the site so readers can find out citations
 * possibly refactor into multiple js files for maintainability
 * weighted average
 * translations for other datasets
 * hide rural polygons when showing IQP data
 * add more percentages to legend and make wider
 * add heat hazard index data
 * add UCA logo
 * pie chart with number of people who responded to each question in the survey
 * one button to download selected data, and one to download complete INE data
 * sheet of all CUSECs as well as aggregated against all variable of a collection
 * default to spanish
 * add color to top header?
 */


import { db, collection, getDocs, connectFirestoreEmulator, query, where } from './firebase_config.js';
import { getHueGradient, getMultiColorGradient, getRainbowGradient, highlight_color, hover_color, selected_color, gradient_opacity } from './map-style.js';
import { formatData } from './format.js';
import { lockSlider, unlockSlider, parseDocs, highlightRow, calculateAggregateData } from './helpers.js';


// Global Data Selection Variables

// three levels of selection to match the collections, documents/tables, and 
let selected_collection = "";
let selected_document = "";
let selected_data = null;


let document_names; // this gets populated with the document names from which ever collection is selected
let old_document = "";
let selected_CUSEC = null;

let aggregated = false;

// original government data
const gov_collection_name = "Zones"; // MUST MATCH THE NAME IN FIREBASE EXACTLY, AND THE NAME IN THE DATASET DROPDOWN (as defined in sidebar-custom.js)
let gov_doc_names;
let snapshot;
let dataLookup = {};  // to store firebase data
let averages = {};    // to store aggregated data

// data from Amanda
const beneficiary_collection_name = "Beneficiary Data";
let beneficiary_snapshot;
let beneficiary_doc_names = [];
let beneficiaryLookup = {};

// IQP data will go here
const IQP_collection_name = "City";
let IQP_snapshot;
let IQP_doc_names = [];
let IQPLookup = {};



// global map variables
let mapLayer;
let geoJSON;

// Get language from URL
const params = new URLSearchParams(window.location.search);
const lang = params.get("lang") || "en";
// can be set with /map/?lang=es

// pull translation file and store globally
// const res = await fetch(`/lang/${lang}.json`);
const translations = await fetch('/lang/' + lang + '.json').then(response => response.json());
// documentname translation file
const dataset_translations = await fetch('/lang/datasets-' + lang + '.json').then(response => response.json());
const document_name_lookup = await fetch('/lang/documents-' + lang + '.json').then(response => response.json());


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



function newDatasetSelectedCallback(e){
    // ! only the td elements are clickable, not the tr !

    selected_data = highlightRow(e.target.id, selected_data);

    console.log("clicked on dataset: "+e.target.id);

    // redraw the map
    drawHeatmap();
    // TODO: make sure when the heatmap is redrawn, the same neighborhood is still highlighted
}

function generate_selected_table(){
    // TODO: if showing aggregated data, then add it so it can be shown, no matter what CUSEC is selected


    // clear old rows
    const row_container = document.getElementById("row_container");
    row_container.innerHTML = "";

    // check that a neighborhood has been selected
    if(! selected_CUSEC && ! aggregated && selected_collection == gov_collection_name){
        // reset table
        row_container.innerHTML = '<tr><td id="initial-row" class="translatable" colspan="2" style="width:100%">Please select a neighborhood to get started...</td></tr>';
        return
    }

    // pull new names
    let dataset_names;
    if(selected_collection == gov_collection_name){
        console.log(dataLookup[selected_CUSEC]);
        dataset_names = Object.keys(dataLookup[selected_CUSEC]["datasets"][selected_document]);
        // dataset_names = Object.keys(snapshot.docs[0].data()["datasets"][selected_document]); // can be pulled from any neighborhood as long as we have data for them all
    }else if(selected_collection == beneficiary_collection_name){
        dataset_names = Object.keys(beneficiaryLookup[selected_document]);
    }else if(selected_collection == IQP_collection_name){
        dataset_names = Object.keys(IQPLookup[selected_document]);
    }else{
        console.log(":(");
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

        if(selected_collection == gov_collection_name){
            try{
                // cusec, "datasets", document name, data name
                number.innerHTML = formatData(dataLookup[selected_CUSEC]["datasets"][selected_document][name], name, selected_document);
            }catch(e){
                console.log(selected_CUSEC);
                console.log(e);
            }
        }else if(selected_collection == beneficiary_collection_name){
            number.innerHTML = formatData(beneficiaryLookup[selected_document][name], name, selected_document);
        }else if(selected_collection == IQP_collection_name){
            number.innerHTML = formatData(IQPLookup[selected_document][name], name, selected_document);
        }else{
            console.log(":(");
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
        selected_data = highlightRow(dataset_names[0]+"i", selected_data);
        old_document = selected_document;
        drawHeatmap();
    }
}

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
        // HACK: needs to be diff for beneficiary data
        if(selected_collection == gov_collection_name){
            if(aggregated){
                statistic = averages[selected_document][selected_data];
            }else{
                statistic = dataLookup[feature.properties.CUSEC]["datasets"][selected_document][selected_data];
            }
        }else if(selected_collection == beneficiary_collection_name){
            statistic = beneficiaryLookup[selected_document][selected_data];
        }else if(selected_collection == IQP_collection_name){
            statistic = parseFloat(IQPLookup[selected_document][selected_data]);
        }else{
            console.log("need 2 implement");
        }
    }

    // fill with a standard color when showing aggregate data
    const f = getRainbowGradient(statistic, min, max);

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
    if(selected_collection == beneficiary_collection_name || selected_collection == IQP_collection_name){
        cusec_element.innerHTML = "---";
    }else{                
        cusec_element.innerHTML = CUSEC;
    }
    selected_CUSEC = CUSEC;

    // generate table row for each stat
    generate_selected_table(); // <- this breaks the first time a zone is selected

    // keep the same row highlighted when a new CUSEC is picked without redrawing the whole table
    selected_data = highlightRow(null, selected_data);
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
        
        let data_value;

        if(selected_collection == gov_collection_name){
            data_value = dataLookup[CUSEC]["datasets"][selected_document][selected_data];
        }else if(selected_collection == beneficiary_collection_name){
            data_value = beneficiaryLookup[selected_document][selected_data];
        }else if(selected_collection == IQP_collection_name){
            data_value = IQPLookup[selected_document][selected_data];
        }else{
            console.log("need 2 implement");
        }

        // breaks for aggregate INE data
        layer.bindPopup("CUSEC: " + CUSEC + "<br>"+display_name+": " + formatData(data_value, selected_data, selected_document), {
            closeButton: false, 
            offset: L.point(0, -10), // Prevents popup from flickering under the cursor
            autoPan: false
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
    // if aggregated is true, draw all of Puerto Real as a connected region ??

    // remove the layer from the map so that it can be re added
    if(mapLayer){
        mapLayer.remove();
    }

    let min, max;
    if(selected_collection == gov_collection_name){
        // pull the statistic for each neighborhood to get max and min numbers
        // store each value in an array for processing at the end
        const stat_dump = [];
        Object.entries(dataLookup).forEach(data => {
            // filter out metadata
            if(data[0] == "_query" || data[0] == "_readTime"){
                return
            }

            try {
                stat_dump.push(data[1]["datasets"][selected_document][selected_data]);
            } catch (error){ 
                console.log("CUSEC: "+data[0]);
                console.error("Error pulling neighborhood data:", error);
            }
        })
        // console.log("pulled for all entries");

        max = Math.max(...stat_dump);
        min = Math.min(...stat_dump);
    }else if(selected_collection == beneficiary_collection_name){
        max = parseFloat(beneficiaryLookup[selected_document][selected_data]);
        min = max;
    }else if(selected_collection == IQP_collection_name){
        max = parseFloat(IQPLookup[selected_document][selected_data]);
        min = max;
    }else{
        console.log("need 2 implement");
    }

    // console.log("Max:\t"+max+"\nMin:\t"+min);

    // Use the lookup in the Leaflet layer
    // console.log(" drawing map layer...");
    mapLayer = L.geoJson(geoJSON, {
        style: feature => stylePolygon(feature, min, max),
        onEachFeature: onZoneClicked
    }).addTo(map);

    // update the legend
    const gradient_row = document.getElementById("gradient");

    gradient_row.style = "background: linear-gradient(to right, "+getRainbowGradient(min, min, max)+", "+getRainbowGradient(max, min, max)+");"+"opacity: " + gradient_opacity;

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

function generateDocumentOptions(){
    const dropdown = document.getElementById("statistics");

    // clear old options (if there are any)
    dropdown.innerHTML = "";

    // console.log(document_names);
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


// called when a new collection is selected from the dropdown
function update_collection(e){
    selected_collection = e.target.value;

    console.log(selected_collection);

    if(selected_collection == gov_collection_name){
        document_names = gov_doc_names;
        
        // format aggregate data selector
        unlockSlider();
    }else if(selected_collection == beneficiary_collection_name){
        document_names = beneficiary_doc_names;
        lockSlider();
    }else if(selected_collection == IQP_collection_name){
        document_names = IQP_doc_names;
        lockSlider();
    }else{
        console.log(":(");
    }
    
    // generate a dropdown to put all of the statistics
    generateDocumentOptions();

    // generate the table for the first document in the new collection
    generate_selected_table();
}

// called when a new document is selected from the dropdown
function update_documentname(e){
    selected_document = e.target.value;
    
    generate_selected_table();
}

function handleDataLoaded(){
    // Only runs once, after each dataset has been pulled and processed

    const collection_dropdown = document.getElementById("collection");
    collection_dropdown.addEventListener("click", update_collection);

    const dropdown = document.getElementById("statistics");
    dropdown.addEventListener("click", update_documentname);

    // default to the first collection
    selected_collection = IQP_collection_name;

    // default to showing government data first
    document_names = IQP_doc_names;

    // default to the first selected dataset
    selected_document = document_names[0];
    selected_data = Object.keys(IQPLookup[selected_document])[0];
    generate_selected_table();

    // generate a dropdown to put all of the statistics
    generateDocumentOptions();

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
    averages = calculateAggregateData(snapshot.docs, gov_doc_names);

    // by defauly, put slider to aggregated, and then lock it
    lockSlider();
}

async function fetchZoneData() {
  try {
    // console.log("connecting to database...");
    const colRef = collection(db, gov_collection_name);
    // console.log("database connected !");

    // store the firebase response globally
    snapshot = await getDocs(colRef);

    // console.log("data recieved!");
    
    if (snapshot.empty) {
      console.log("No documents found.");
      return;
    }

    // Create the lookup object
    dataLookup = parseDocs(snapshot);
    gov_doc_names = Object.keys(snapshot.docs[0].data()["datasets"]); // can be pulled from any dataset, so the first is used
  } catch (error) {
    console.error("Error pulling Firestore data:", error);
  }
}

async function fetchBeneficiaryData() {
    try{
        const colRef = collection(db, beneficiary_collection_name);

        // store the firebase response globally
        beneficiary_snapshot = await getDocs(colRef);

        if (beneficiary_snapshot.empty) {
            console.log("No documents found.");
            return;
        }
        
        beneficiaryLookup = parseDocs(beneficiary_snapshot);
        beneficiary_snapshot.docs.forEach(doc => {
            beneficiary_doc_names.push(doc.id);
        });
    } catch (error) {
        console.error("Error pulling Firestore data:", error);
    }
}

async function fetchIQPData() {
    try{
        const colRef = collection(db, IQP_collection_name);

        // store the firebase response globally
        IQP_snapshot = await getDocs(colRef);

        if (IQP_snapshot.empty) {
            console.log("No documents found.");
            return;
        }
        
        IQPLookup = parseDocs(IQP_snapshot);
        IQP_snapshot.docs.forEach(doc => {
            IQP_doc_names.push(doc.id);
        });
    } catch (error) {
        console.error("Error pulling Firestore data:", error);
    }
}

// Run it!
Promise.all([
    fetchZoneData(),
    fetchBeneficiaryData(),
    fetchIQPData()
]).then(handleDataLoaded);

const toggle_switch = document.getElementById("toggle");
toggle_switch.addEventListener("change", (e) => {
    aggregated = e.target.checked;
    const cusec_element = document.getElementById("CUSEC");
    
    // switch to view of aggregated data for the whole city or
    // reset to display section-specific data
    drawHeatmap();

    if(aggregated){
        cusec_element.innerHTML = "---";
    }else{    
        cusec_element.innerHTML = selected_CUSEC;
    }

    generateDocumentOptions();
    generate_selected_table();
    // TODO: can I use onZoneSelected here?
});
