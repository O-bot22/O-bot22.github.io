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

var overlayMaps = {
    "Cities": cities
};


// add the legend object to the map instance
var layerControl = L.control.layers(baseMaps, overlayMaps).addTo(map);

  
fetch('https://raw.githubusercontent.com/O-bot22/O-bot22.github.io/refs/heads/from_scratch/assets/data/puerto_real_zones.geojson')
    .then(response => 
        response.json()
    )
    .then(data => {
        console.log(data);
        L.geoJSON(data).addTo(map);
    });