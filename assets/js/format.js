// used in map.js to format the data in the legend and the popups
function formatData(number, dataset_name, selected_document, round=3){
    let pre = "";
    let post = "";
    
    try{
        // console.log(number);
        // console.log(dataset_name+" _____ "+selected_document);
        if(selected_document.includes("IQP Data")){
            /* pass, data is already formatted */
        }else if(selected_document.includes("Open Ended Questions")){
            number = (number*100).toFixed(0);
            post = "%";
        }else if(selected_document.includes("HVI")){
            number = (number*100).toFixed(round);
            post = "%";
        }else if(selected_document.includes("Heat Vulnerability and Hazard Indices")){
            number = number.toFixed(round);
        }else if(selected_document.includes("tabla_30949")){
            number = parseFloat(number).toFixed(1);
            post = "%";
        }else if(dataset_name.includes("fuente_de_ingreso")){
            // console.log('g');
            // console.log(number);
            // console.log(parseFloat(number).toFixed(1));
            number = parseFloat(number).toFixed(1);
            post = "%";
        }else if(dataset_name.includes("Porcentaje") || dataset_name.includes("<") || dataset_name.includes(">")){
            // the >65 and <18 and <4 from the beneficiary data are percentages
            post = "%";
        }else if(selected_document.includes("tabla_30946")){
            number = (number*1).toFixed(1);
            post = "%"; 
        }else if(dataset_name.includes("poblacion") && dataset_name != "poblacion_16_y_mas_total"){ // needs to exclude the total population over 16, which is just a number that needs commas, not a percentage
            // needs to exclude the populations under ecenomic activity, which are just number of people
            if(selected_document != "tabla_66687"){
                post = "%";
            }
        }else if(dataset_name == "tasa_paro_hombres" || dataset_name == "tasa_paro_mujeres" || dataset_name == "tasa_empleo_mujeres" || dataset_name == "tasa_empleo_hombres" || dataset_name == "tasa_empleo_total" || dataset_name == "tasa_paro_total"){
            number = (number*100).toFixed(round);
            post = "%";
        }else if(dataset_name.includes("tasa")){
            console.log("found tasa: "+dataset_name);
        }else if(selected_document == "tabla_30944" || dataset_name.includes("Ingresos medios") || dataset_name.includes("Coste medio mensual luz")){
            pre = "€";
            // add commas
            number = number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }else if(number > 1000){
            // add commas
            number = number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }

        // if(number.){
        //     // maybe do by length?
        //     number = Number.parseFloat(number.toFixed(round));
        // }
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