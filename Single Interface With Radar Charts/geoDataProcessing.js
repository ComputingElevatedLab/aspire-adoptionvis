let full_map_data = false;

let code_filename_dict = {};
let name_to_code_dict = {};
let code_name_dict = {};

let wrong_county_name_dict = {};

let showing_map_data;

setWrongCountyNameDict();

async function getMapData(target_id){//call the map json data from the data files
    if(target_id==="USA"){
        await d3.json("data/us_albers.json").then((data)=>{
            let mapData = topojson.feature(data, data.objects[Object.keys(data.objects)[0]]);
            let state_name;
            let state_code;
            mapData.features = mapData.features.filter((item) => {
                return ['HI', 'AK', 'PR'].includes(item.properties.iso_3166_2) === false;
            });
            showing_map_data = mapData;
            if(Object.keys(code_filename_dict).length === 0){
                mapData.features.forEach((stateData)=>{
                    state_name = stateNameProcessing(stateData.properties.name);
                    state_code = "S" + stateData.properties.fips_state;
                    name_to_code_dict[state_name] = state_code;
                    code_filename_dict[state_code] = makeStateFileName(stateData.properties);
                    // code_filename_dict[name_code_dict[stateData.properties.name.toLowerCase().replace(/(\s*)/g,"")].state_code] = makeStateFileName(stateData.properties);
                })
            }
        })
    }else{
        let file_name = code_filename_dict[target_id];
        await d3.json("data/us-states/" + file_name).then((data)=>{
            showing_map_data = topojson.feature(data, data.objects[Object.keys(data.objects)[0]]);;
        })
    }
}

function makeStateFileName(properties) {//function for the state map json files
    const postal = properties.iso_3166_2;
    const counties = properties.fips_state;
    const full_name = properties.name.replace(/ /gi, "-").toLowerCase();
    if (postal === "LA") {
        return postal + "-" + counties + "-" + full_name + "-parishes.json";
    }
    return postal + "-" + counties + "-" + full_name + "-counties.json";
}

//-------------------

function stateNameProcessing(state_name){
    let result;
    result = state_name.toLowerCase()

    result = removeSaintPart(result).replace(/(\s*)/g,"").replace(/[^a-z]/gi,"");

    return result;
}

function countyNameProcessing(county_name){//To make county name to serial string
    let result;
    result = county_name.toLowerCase()

    result = removeSaintPart(result).replace(/(\s*)/g,"").replace(/[^a-z]/gi,"");

    return result;
}

function removeSaintPart(county_name){//To ignore the Saint states
    let result = county_name;
    if(county_name.split(" ")[0]==="saint"){
        result = county_name.substr(6);
    }
    if(county_name.split(" ")[0]==="sainte"){
        result = county_name.substr(7);
    }
    if(county_name.split(" ")[0]==="st."){
        result = county_name.substr(4);
    }
    if(county_name.split(" ")[0]==="ste."){
        result = county_name.substr(5);
    }

    return result
}

function setWrongCountyNameDict(){//some state's name in both files are different
    wrong_county_name_dict["shannoncounty"] = "oglalalakotacounty";
    wrong_county_name_dict["doaanacounty"] = "donaanacounty";
}
