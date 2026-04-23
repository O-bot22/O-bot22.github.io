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

    return selected_data;
}

function calculateAggregateData(docs, gov_doc_names){
    // const docs = snapshot.docs;
    // look in each document for each statistic for each document
    const averages = {};
    gov_doc_names.forEach((document_name) => {
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
    return averages;
}

export { lockSlider, unlockSlider, highlightRow, parseDocs, calculateAggregateData };