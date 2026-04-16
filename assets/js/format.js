// used in map.js to format the data in the legend and the popups
function formatData(number, dataset_name, selected_table){
    let pre = "";
    let post = "";
    try{
        if(dataset_name.includes("fuente_de_ingreso")){
            post = "%";
        }else if(dataset_name.includes("fuente_de_ingreso")){
            // TODO: for long numbers add in commas
        }else if(dataset_name.includes("Porcentaje")){
            post = "%";
        }else if(dataset_name.includes("poblacion") && dataset_name != "poblacion_16_y_mas_total"){ // needs to exclude the total population over 16, which is just a number that needs commas, not a percentage
            // needs to exclude the populations under ecenomic activity, which are just number of people
            if(selected_table != "tabla_66687"){
                post = "%";
            }
        }else if(dataset_name == "tasa_paro_hombres" || dataset_name == "tasa_paro_mujeres" || dataset_name == "tasa_empleo_mujeres" || dataset_name == "tasa_empleo_hombres" || dataset_name == "tasa_empleo_total" || dataset_name == "tasa_paro_total"){
            number = (number*100).toFixed(2);
            post = "%";
        }else if(dataset_name.includes("tasa")){
            console.log("found tasa: "+dataset_name);
        }else if(selected_table == "tabla_30944"){
            pre = "€";
            // add commas
            number = number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }else if(number > 1000){
            // add commas
            number = number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }
        // once all other formatting is done, switch the decimal point to a comma if in spanish and the comma to a decimal point, since that is the standard formatting in spanish, but not if in english, since that is the standard formatting in english
        if(lang == "es"){
            // change to a temp character to mark decimal points
            number = number.toString().replaceAll(".", "@");
            // change commas to decimal points
            number = number.toString().replaceAll(",", ".");
            // change temp character to commas
            number = number.toString().replaceAll("@", ",");
        }
    } catch (e){
        console.log(dataset_name);
        console.log(e);
    };
    return pre + number + post;
}

export { formatData };