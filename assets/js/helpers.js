// helper functions for map.js
function lockSlider(){
    const toggle_switch = document.getElementById("toggle");
    toggle_switch.checked = true;
    toggle_switch.disabled = true;
    const slider_span = document.getElementById("slider-span");
    slider_span.style.cursor = "not-allowed";
    slider_span.style.opacity = 0.6;
}
function unlockSlider(){
    const toggle_switch = document.getElementById("toggle");
    toggle_switch.checked = false;
    toggle_switch.disabled = false;
    const slider_span = document.getElementById("slider-span");
    slider_span.style.cursor = "pointer";
    slider_span.style.opacity = 1;
}


function parseDocs(snapshot){
    const dataLookup = {};
    snapshot.forEach(doc => {
        dataLookup[doc.id] = doc.data();
    });
    return dataLookup;
}

function highlightRow(id, selected_data, highlight_color = "#c9ffc9"){
    // get the data name
    if(id){
        // update selected data, and then return it outside the function to update it globally
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
            grandchild.style.backgroundColor = "white";
        }
    }

    // highlight the selected row
    // change the base element
    const td_element = document.getElementById(id);
    td_element.style.backgroundColor = highlight_color;
    // get the other element of the row
    const other_element = document.getElementById(selected_data + (e_type == "#" ? "i" : "#"));
    other_element.style.backgroundColor = highlight_color;

    return selected_data;
}

/**
 * Calculates population-weighted averages across a set of documents.
 * @param {Array} docs - Array of Firestore-style document snapshots.
 * @param {Array} gov_doc_names - Keys for the specific datasets to aggregate.
 * @returns {Object} Nested object containing weighted averages per statistic.
 */
function calculateAggregateData(docs, gov_doc_names) {
    const averages = {};

    gov_doc_names.forEach((docName) => {
        // Use the first document as a template for available statistic keys
        const statNames = Object.keys(docs[0].data()["datasets"][docName]);
        averages[docName] = {};

        statNames.forEach(statName => {
            let totalWeightedValue = 0;
            let totalPopulation = 0;

            docs.forEach(doc => {
                const data = doc.data()["datasets"][docName];
                const population = doc.data()['datasets']['tabla_69142']['total_total'];
                const statValue = data[statName];

                totalWeightedValue += (statValue * population);
                totalPopulation += population;
            });

            // Prevent division by zero and format to 2 decimal places
            const result = totalPopulation > 0 
                ? (totalWeightedValue / totalPopulation).toFixed(2) 
                : "0.00";

            averages[docName][statName] = result;
        });
    });

    return averages;
}


export { lockSlider, unlockSlider, highlightRow, parseDocs, calculateAggregateData };