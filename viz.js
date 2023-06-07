// window.onload=drawOpenLayersMap;
let width = document.body.clientWidth * 0.64;
var radarChart=null;
let mouse_overed_state_on_bar = "";
let hourwise_string="";
let height = 500;
let show_chargers=true;
let file_location = 'data/stations.csv';
let svg_map = d3.select('#stations-over-time-viz').append('svg')
    .attr('width', width)
    .attr('height', height);
let metrics_selected=[];
let metrics_hashmap=[];
let metrics_array=[];
var myExtent = [
    -12553481.8104441,
    4866886.776642518,
    -12322948.771123363,
    5097419.815963253
];
var station_coordinates;
var showNewElec=true;
var showPoi=true;
var elec_features = [];
var new_elec_features=[];
var station_features=[];
var new_name,new_charge,new_geometry;

function reset(){
    let myExtent1=[
        -12553481.8104441,
        4866886.776642518,
        -12322948.771123363,
        5097419.815963253
    ];
    myExtent=myExtent1;
    center=ol.proj.fromLonLat([-111.0937, 39.3210]);
    zoom=7.7;
    map.setView(new ol.View({
        zoom: zoom,
        center: center,
    }));
}

function deleteStation(){
    console.log("trying to delete?");
    for(let ind=0;ind<new_elec_features.length;ind++){
        if(new_name===new_elec_features[ind].values_['name']&&
            new_charge===new_elec_features[ind].values_['charge']&&
            new_geometry===new_elec_features[ind].values_['geometry']){
            new_elec_features.splice(ind,1);
            break;
        }
    }
    let pop=document.getElementById('popup');
    pop.style.display="none";
    drawStations();
}
function divideArray(array, numOfPartitions) {
    const frequencyMap = {};
    const partitions = [];

    // Count frequency of each element in the array
    array.forEach(element => {
        if (!frequencyMap[element]) {
            frequencyMap[element] = 1;
        } else {
            frequencyMap[element]++;
        }
    });

    // Sort the elements based on frequency
    const sortedArray = array.sort((a, b) => frequencyMap[a] - frequencyMap[b]);

    // Calculate target frequency
    const targetFrequency = array.length / numOfPartitions;

    // Create partitions
    let partitionIndex = 0;
    while (sortedArray.length > 0) {
        if (!partitions[partitionIndex]) {
            partitions[partitionIndex] = [];
        }

        const currentElement = sortedArray.shift();
        partitions[partitionIndex].push(currentElement);
        frequencyMap[currentElement]--;

        if (partitions[partitionIndex].length === targetFrequency) {
            partitionIndex++;
        }

        if (frequencyMap[currentElement] === 0) {
            delete frequencyMap[currentElement];
        }
    }

    return partitions;
}

let center=ol.proj.fromLonLat([-111.0937, 39.3210]);
let zoom=7.7;

const map = new ol.Map({
    target: 'js-map',
    view: new ol.View({
        center: center,
        zoom: zoom,
    })
});

let projection = d3.geoMercator()
    .scale(1)
    .translate([0, 0]);

let path = d3.geoPath()
    .projection(projection);

let allData = {};
let poiData={};
let newStations={};
let charge={};
let tilesData={};
let cityData={};
let dataLoaded = 0;

let cngData = {};
let lngData = {};
let lpgData = {};
let e85Data = {};
let bdData = {};
let elecData = {};
let hyData = {};

let allData_count = {};
let law_data = {};

let key_list = [];

let visibleRange = [1994, 2022];
let visibleStations = [];

let selectedFuelTypes = {
    'cng': false,
    'lng': false,
    'lpg': false,
    'e85': false,
    'bd': false,
    'elec': true,
    'hy': false,
};

let colors = {
    'cng': "#1f77b4",
    'lng': "#ff7f0e",
    'lpg': "#2ca02c",
    'e85': "#d62728",
    'bd': "#9467bd",
    'elec': "#8c564b",
    'hy': "#e377c2",
};

let svg_map_group = svg_map.append('g').attr('id', 'maps');

let stationData = {};

let current_showing_data_name = "USA";
let current_showing_state_postal = "USA";

let mouse_overed_state_full_name;
let mouse_overed_state_postal;
let mouse_overed_state_id;

let mouse_overed_station;

function loadTiles(data){
    tilesData['tile']=data;
    console.log(tilesData['tile'].features.length+"Tile data");
}

function loadPoi(data){
    poiData['poi'] = data;
    console.log(poiData['poi'].length);
}

function loadCharge(data){
    charge['charge']=data;
    console.log(charge['charge'].length);
}

function loadCityData(data) {
    cityData['city'] = data;
    console.log("citydata loaded");
    console.table(cityData);
}

d3.csv('data/elec-batteries.csv').then( (data) => {
    loadCharge(data);
})

function loadData(data, name) {
    data = data.filter((item) => {
        return ['HI', 'AK', 'PR'].includes(item.State) === false;
    });

    data.forEach((d) => {
        let i=0;
        if(d['Status Code']!=='T') {
            d['Open Date'] = d3.timeParse("%m/%d/%Y")(d['Open Date']);
            d['color'] = colors[name];
        }
    });

    let number_per_year = {};
    for (let year = 1994; year <= 2022; ++year) {
        data[year] = data.filter((d) => {
            return d['Open Date'] < new Date(year + 1, 0) &&
                d['Open Date'] > new Date(year - 1, 11, 31, 23);
        });
        number_per_year[year] = {};
        number_per_year[year]['USA'] = data[year].length;
        data[year].forEach((d) => {
            if (number_per_year[year][d.State] === undefined) {
                number_per_year[year][d.State] = 0;
            }
            number_per_year[year][d.State] += 1;
        })
    }

    allData_count[name] = number_per_year;
    allData[name] = data;
    ++dataLoaded;
}

function loadData_law(data){
    let state_law, date_law, target_list_law;
    let result = [];
    data.forEach((data_row)=>{
        state_law = data_row['State'];
        date_law = data_row['Enacted Date'].slice(0,4);
        target_list_law = data_row['Technology Categories'].split('|');

        target_list_law.forEach((fuel_type)=>{
            if(law_data[fuel_type] === undefined){
                law_data[fuel_type] = {};
            }
            if(law_data[fuel_type][date_law]===undefined){
                law_data[fuel_type][date_law] = {'USA':0};
            }
            if(law_data[fuel_type][date_law][state_law] === undefined){
                law_data[fuel_type][date_law][state_law] = 0;
            }
            law_data[fuel_type][date_law][state_law] += 1;
            law_data[fuel_type][date_law]['USA'] += 1;
        })
        law_data['lng'] = {};
        law_data['lng'][date_law] = {'USA':0};
        law_data['lng'][date_law][state_law] = 0;
    })

}

function toggleSt(){
    console.log("togglest");
    let olMap=document.getElementById('js-map');
    map.getInteractions().forEach(function(interaction) {
      interaction.setActive(false)
    })
    olMap.style.opacity='0.4';
    map.on('click', function(evt) {
      console.log(evt.coordinate);
        let wgs84Coordinates = ol.proj.transform(evt.coordinate, 'EPSG:3857', 'EPSG:4326');
        document.getElementById('lat_input').value=""+wgs84Coordinates[1];
        document.getElementById('lon_input').value=""+wgs84Coordinates[0];
    })
    let popup_metric=document.getElementById('popup_metric');
    let popup_add_st=document.getElementById('popup_add_st');
    if (popup_add_st.style.display === "none") {
        popup_add_st.style.display = "block";
    }
    popup_metric.style.display="none";
}

function cancel_pan(){
    console.log("cancelpan");
    let popup_pan=document.getElementById('popup_metric');
    popup_pan.style.display="none";
}

function cancel(){
    console.log("Cancel");
    let togg_st=document.getElementById('station');
    if(togg_st.classList.contains("pressed")) {
        togg_st.classList.toggle('pressed');
    }
    let popup_add_st=document.getElementById('popup_add_st');
    popup_add_st.style.display="none";
    let olMap=document.getElementById('js-map');
    olMap.style.opacity='1';
    map.getInteractions().forEach(function(interaction) {
        interaction.setActive(true)
    })
}

function toggleVis(){
    console.log("togglevis");
    let olMap=document.getElementById('js-map');
    olMap.style.opacity='1';
    map.getInteractions().forEach(function(interaction) {
        interaction.setActive(true)
    })
    let popup_metric=document.getElementById('popup_metric');
    let popup_add_st=document.getElementById('popup_add_st');
    if (popup_metric.style.display === "none") {
        popup_metric.style.display = "block";
    }
    popup_add_st.style.display="none";
}
function showChargers(){
    if(station_features.length===0) {
        let url = 'http://144.39.204.242:11236/charger';
        fetch(url)
            .then((response) => {
                return response.json();
            })
            .then((data) => {
                let arr = data.data;
                for (let i = 0; i < arr.length; i++) {
                    let url1="http://144.39.204.242:11236/charger/"+arr[i]['id']+"/status?recent=true";
                    fetch(url1)
                        .then((res) => {
                            return res.json();
                        }).then(dat=>{
                            let dic=dat.data;
                            let ch=dic['status'];
                        station_features.push(new ol.Feature({
                            geometry: new ol.geom.Point(ol.proj.fromLonLat([+arr[i]['longitude'], +arr[i]['latitude']])),
                            name: arr[i]['chargerName'],
                            type: "API",
                            city: "sample city",
                            charge: ch,
                            size: 10
                        }));
                    })
                }
                console.log(station_features);
                sleep(1000).then(() => {
                    console.log(station_features);
                    drawStations();
                });
            })
    }
}
function toggleApi(){
    if(show_chargers)
        show_chargers=false;
    else
        show_chargers=true;
    drawStations();
}

function toggleElec(){
    if(selectedFuelTypes['elec'])
    selectedFuelTypes['elec']=false;
    else
        selectedFuelTypes['elec']=true;
    drawStations();
}

function toggleNewElec(){
    if(showNewElec)
        showNewElec=false;
    else
        showNewElec=true;
    drawStations();
}

function togglePoi(){
    if(showPoi)
        showPoi=false;
    else
        showPoi=true;
    drawStations();
}

function addStation(){
    let st_name=document.getElementById('station_input').value;
    let charge_val=document.getElementById('charge_input').value;
    let lat=document.getElementById('lat_input').value;
    let lon=document.getElementById('lon_input').value;
    charge_val=+charge_val;
    lat=+lat;
    lon=+lon;
    let arr=[st_name,charge_val,lat,lon];
    newStations[{'st_name':st_name,'charge_val':charge_val,'lat':lat,'lon':lon}];
    let isChecked=false;
    if(!isChecked) {
        new_elec_features.push(new ol.Feature({
            geometry: new ol.geom.Point(ol.proj.fromLonLat([lon, lat])),
            name: st_name,
            type: "new",
            city: "sample city",
            charge: charge_val,
            size: 10
        }));
    }
    else{
        new_elec_features.push(new ol.Feature({
            geometry: new ol.geom.Point(station_coordinates),
            name: st_name,
            type: "new",
            city: "sample city",
            charge: charge_val,
            size: 10
        }));
    }
    console.log(newStations);
    drawStations();
}

function drawBarChart(bars, metrics_selected, cityName) {
    console.log(bars);
    let nonExistentValue = bars.find(item => isNaN(item));
    console.log(nonExistentValue);
    if(bars.length===0||nonExistentValue!==undefined)
    {
        let barchartPopup = document.getElementById("popup_barchart");
        barchartPopup.style.display="none";
        console.log("visiblity gone");
    }
    else{
        let barchartPopup = document.getElementById("popup_barchart");
        barchartPopup.style.display="block";
        console.log("visiblity back");
    }
    let c_palette = ['255, 0, 0', '0, 255, 0', '0, 0, 255', '255, 255, 0', '255, 0, 255', '0, 255, 255', '128, 0, 128', '255, 165, 0', '0, 128, 128'];
    let canvas = document.getElementById('barChart');
    canvas.style.width = "150px";
    canvas.style.height = "75px";
    canvas.style.background = "#FFF";
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#FFF";
    context.fillRect(0, 0, canvas.width, canvas.height);
    const barWidth = canvas.width / bars.length;
    for (let i = 0; i < bars.length; i++) {
        context.fillStyle = 'rgb(' + c_palette[i] + ')';
        context.fillRect(i * barWidth, canvas.height - (bars[i] * canvas.height), barWidth, bars[i] * canvas.height);
        const labelX = i * barWidth + barWidth / 2;
        const labelY = canvas.height - 10;
        let textSize = canvas.width / (bars.length * 5.5);
        context.fillStyle = '#000';
        context.font = textSize.toString() + 'px helvetica';
        context.textAlign = 'center';
        context.fillText(metrics_selected[i], labelX, labelY);
    }
    context.fillStyle = '#000';
    // context.fillText(cityName, 150, 20);
}



function setText(text) {
    if (document.getElementById("vis_metric").value === "hours")
    {
        let hour = text;
        hour = +hour;
        hour = hour - 1;
        if (hour < 10)
            document.getElementById("hour_vis").innerHTML = "0" + hour + ":00";
        else document.getElementById("hour_vis").innerHTML = hour + ":00";
    }
}

function hideLoader(){
    document.getElementById("loader").style.visibility='hidden';
}

function drawStations() {
   let selected_viz= document.getElementById("visualization_tool").value;
    console.log(elec_features);
    console.log(newStations);
    $('div.ol-zoom-out').text('-');
    console.log(myExtent);
    let milliseconds_start = (new Date()).getTime();
    // document.getElementById("loader").style.visibility='visible';
    let hour=10;
    let metric= document.getElementById("vis_metric").value;
    if(metric==="hours") {
        document.getElementById("poi_hour").max=24;
        document.getElementById("poi_hour").min=1;
        document.getElementById("poi_hour").innerHTML="Hour for Visualization";
        hour = document.getElementById("poi_hour").value;
        hour=+hour;
        hour=hour-1;
        if (hour < 10)
            document.getElementById("hour_vis").innerHTML = "0" + hour + ":00";
        else document.getElementById("hour_vis").innerHTML = hour + ":00";
    }
    if(metric==="visits"){
        document.getElementById("poi_hour").max=30;
        document.getElementById("poi_hour").min=1;
        document.getElementById("poi_hour").innerHTML="Day for Visualization";
        hour = document.getElementById("poi_hour").value;
        hour=+hour;
        hour=hour-1;
        document.getElementById("hour_vis").innerHTML =  hour+1;
    }
    let charge_data=charge['charge'];
    let data2Dict ={};
    charge_data.forEach(function(d){
        data2Dict[d['ID']]=d['Battery Level'];
    })

    // const elements = document.getElementsByClassName("map");
    // while(elements.length > 0){
    //     elements[0].parentNode.removeChild(elements[0]);
    // }
    // const elem = document.createElement('div');
    // elem.setAttribute("id", "js-map");
    // elem.setAttribute("class", "map");
    // document.getElementById("division").appendChild(elem);
    let startYear = visibleRange[0];
    let endYear = visibleRange[1];

    if (startYear < 1995)
        startYear = 1995;
    if (endYear > 2022)
        endYear = 2022;

    // d3.select('#year-label').text(startYear + ' - ' + endYear);

    let data = [];
    let data1=poiData['poi'];
    let tile_data=tilesData['tile'];
    for (let year = startYear; year <= endYear; ++year) {
        if (selectedFuelTypes['cng'])
            data = data.concat(allData['cng'][year]);

        if (selectedFuelTypes['lng'])
            data = data.concat(allData['lng'][year]);

        if (selectedFuelTypes['lpg'])
            data = data.concat(allData['lpg'][year]);

        if (selectedFuelTypes['e85'])
            data = data.concat(allData['e85'][year]);

        if (selectedFuelTypes['bd'])
            data = data.concat(allData['bd'][year]);

        if (selectedFuelTypes['elec'])
            data = data.concat(allData['elec'][year]);

        if (selectedFuelTypes['hy'])
            data = data.concat(allData['hy'][year]);
    }

    if (current_showing_data_name !== "USA") {
        data = data.filter((station) => {
            return current_showing_state_postal === station.State;
        })
    }
    let shp_start = (new Date()).getTime();
    // console.table(data)
    let shp_features=tile_data;
    let min_scale=0;
    let max_scale=0;
    console.log(shp_features.features);
    let array_metrics=[];
    let thing=0;
    let geojson_features=[];
    let selected_metric='';
    let selected_metrics=[];
    let sortedList = document.getElementById("checkbox-list");
    console.log(sortedList);
    let listElements = sortedList.querySelectorAll("input");
    for(let thing=0;thing<listElements.length;thing++){
        let metrica = document.getElementById(listElements[thing].value+"_label");
        metrica.style.color="#000";
        metrica.style.background="#FFF";
        {
            if($(this).is(':checked')) {
                selected_metrics.push($(this).val());
            }
        }
        if(listElements[thing].checked)
            selected_metrics.push(listElements[thing].value);
    }
    if(selected_metrics.length!=0){

        if (radarChart) {
            radarChart.destroy(); // Destroy the existing chart
        }
        let canvas_legend=document.getElementById('legend_canvas');
        // Data for the radar chart (only labels, no data)
        const data_legend = {
            labels: selected_metrics
        };

// Configuration options for the radar chart
        const options = {
            responsive: false, // Disable responsiveness
                maintainAspectRatio: false, // Disable aspect ratio
                animation: false, // Disable animation
                scales: {
                r: {
                    angleLines: {
                        display: true, // Show angle lines
                    },
                    grid: {
                        display: true, // Show grid lines
                    },
                    ticks: {
                        display: false, // Hide tick labels
                    },
                    pointLabels: {
                        display: true,//Hide the labels
                    },
                },
            },
            plugins: {
                legend: {
                    display: false, // Hide legend
                },
            },
            interaction: {
                mode: 'nearest', // Disable hover interactions
            },
        }

if(selected_viz==="radar") {
    document.getElementById("legend_canvas").style.display="block";
// Create the radar chart
    radarChart = new Chart(canvas_legend, {
        type: 'radar',
        data: data_legend,
        options: options,
    });
}
else{
    document.getElementById("legend_canvas").style.display="none";
}
    }
    // $('input:checkbox').each(function () {
    //     if ($(this)[0].id === "population")
    //     {
    //         let metrica = document.getElementById("population"+"_label");
    //         metrica.style.color="#000";
    //         metrica.style.background="#FFF";
    //         {
    //             if($(this).is(':checked')) {
    //                 selected_metrics.push($(this).val());
    //             }
    //         }
    //     }
    //     if ($(this)[0].id === "age")
    //     {
    //         let metrica = document.getElementById($(this).val()+"_label");
    //         metrica.style.color="#000";
    //         metrica.style.background="#FFF";
    //         {
    //             if($(this).is(':checked'))
    //                 selected_metrics.push($(this).val());
    //         }
    //     }
    //     if ($(this)[0].id === "poverty")
    //     {
    //         let metrica = document.getElementById($(this).val()+"_label");
    //         metrica.style.color="#000";
    //         metrica.style.background="#FFF";
    //         {
    //             if($(this).is(':checked'))
    //                 selected_metrics.push($(this).val());
    //         }
    //     }
    //     if ($(this)[0].id === "pollution")
    //     {
    //         let metrica = document.getElementById($(this).val()+"_label");
    //         metrica.style.color="#000";
    //         metrica.style.background="#FFF";
    //         {
    //             if($(this).is(':checked'))
    //                 selected_metrics.push($(this).val());
    //         }
    //     }
    //     if ($(this)[0].id === "cancer")
    //     {
    //         let metrica = document.getElementById($(this).val()+"_label");
    //         metrica.style.color="#000";
    //         metrica.style.background="#FFF";
    //         {
    //             if($(this).is(':checked'))
    //                 selected_metrics.push($(this).val());
    //         }
    //     }
    //     if ($(this)[0].id === "food")
    //     {
    //         let metrica = document.getElementById($(this).val()+"_label");
    //         metrica.style.color="#000";
    //         metrica.style.background="#FFF";
    //         {
    //             if($(this).is(':checked'))
    //                 selected_metrics.push($(this).val());
    //         }
    //     }
    //     if ($(this)[0].id === "unemployment")
    //     {
    //         let metrica = document.getElementById($(this).val()+"_label");
    //         metrica.style.color="#000";
    //         metrica.style.background="#FFF";
    //         {
    //             if($(this).is(':checked'))
    //                 selected_metrics.push($(this).val());
    //         }
    //     }
    //     if ($(this)[0].id === "homeless")
    //     {
    //         let metrica = document.getElementById($(this).val()+"_label");
    //         metrica.style.color="#000";
    //         metrica.style.background="#FFF";
    //         {
    //             if($(this).is(':checked'))
    //                 selected_metrics.push($(this).val());
    //
    //         }
    //     }
    //     if ($(this)[0].id === "housing")
    //     {
    //         let metrica = document.getElementById($(this).val()+"_label");
    //         metrica.style.color="#000";
    //         metrica.style.background="#FFF";
    //         {
    //             if($(this).is(':checked'))
    //                 selected_metrics.push($(this).val());
    //         }
    //     }
    // })
    // console.log(selected_metrics);
    // for(i = 0; i < ele.length; i++) {
    //     console.log(ele[i]+"the element");
    //         if(ele[i].checked)
    //             selected_metric=ele[i].value;
    // }
    let hashmap_metrics = [];
    let c_palette=['255, 0, 0','0, 255, 0','0, 0, 255','255, 255, 0', '255, 0, 255','0, 255, 255','128, 0, 128','255, 165, 0','0, 128, 128'];
    for(let ind=0;ind<selected_metrics.length;ind++){
        array_metrics.push([]);
        hashmap_metrics.push({});
        let selected_metrica = document.getElementById(selected_metrics[ind]+"_label");
        selected_metrica.style.color="#FFF";
        selected_metrica.style.background='rgb(' + c_palette[ind]+')';
    }
    console.log(selected_metrics+"The selected metrics");
    for(let ind=0;ind<selected_metrics.length;ind++) {
        let multiplier=1;
        for (thing = 0; thing < shp_features.features.length; thing++) {
            console.log(shp_features.features[thing].geometry.coordinates[0][0][0],shp_features.features[thing].geometry.coordinates[0][0][1]);
            console.log("feature!!");
            if (selected_metrics[ind] === 'lowincfpct') {
                console.log("check " + shp_features.features[thing].properties['population']);
                multiplier = (+shp_features.features[thing].properties['population']);
            }
            // let arr=[population,over64pct,lowincfpct,pm25,cancer,foodsrtpct,unemppct,homelespct,housebrdn]
            if (max_scale < shp_features.features[thing].properties[selected_metrics[ind]] * multiplier)
                max_scale = shp_features.features[thing].properties[selected_metrics[ind]] * multiplier;
            array_metrics[ind].push(shp_features.features[thing].properties[selected_metrics[ind]] * multiplier);
            console.log(shp_features.features[thing]);
            let minimum_lat=shp_features.features[thing].geometry.coordinates[0][shp_features.features[thing].geometry.coordinates[0].length-1][0];
            let minimum_long=shp_features.features[thing].geometry.coordinates[0][shp_features.features[thing].geometry.coordinates[0].length-1][1];
            let maximum_lat=minimum_lat;
            let maximum_long=minimum_long;
            let lat_sum=0;
            let long_sum=0;
            let coords=[];
            for(let indenter=0;indenter<shp_features.features[thing].geometry.coordinates[0].length;indenter++){
                console.log(shp_features.features[thing].geometry.coordinates[0][indenter]);
                coords.push(shp_features.features[thing].geometry.coordinates[0][indenter]);
                if(minimum_lat>shp_features.features[thing].geometry.coordinates[0][indenter][0]){
                    minimum_lat=shp_features.features[thing].geometry.coordinates[0][indenter][0];
                }
                if(maximum_lat<shp_features.features[thing].geometry.coordinates[0][indenter][0]){
                    maximum_lat=shp_features.features[thing].geometry.coordinates[0][indenter][0];
                }
                if(minimum_long>shp_features.features[thing].geometry.coordinates[0][indenter][1]){
                    minimum_long=shp_features.features[thing].geometry.coordinates[0][indenter][1];
                }
                if(maximum_long<shp_features.features[thing].geometry.coordinates[0][indenter][1]){
                    maximum_long=shp_features.features[thing].geometry.coordinates[0][indenter][1];
                }
                lat_sum=lat_sum+shp_features.features[thing].geometry.coordinates[0][indenter][0];
                long_sum=long_sum+shp_features.features[thing].geometry.coordinates[0][indenter][1];
            }

            long_sum=long_sum/shp_features.features[thing].geometry.coordinates[0].length;
            lat_sum=lat_sum/shp_features.features[thing].geometry.coordinates[0].length;
            let lat_coord=lat_sum;
            let long_coord=long_sum;
            let pol;
            let com;
            if(coords.length>3){
                pol=turf.polygon([coords]);
                com=turf.centerOfMass(pol);
                console.log(com.geometry.coordinates);
                lat_coord=com.geometry.coordinates[0];
                long_coord=com.geometry.coordinates[1];
            }

            geojson_features.push(new ol.Feature({
                geometry: new ol.geom.Point([lat_coord,long_coord]),
                size: 10,
                type: "old",
                name: shp_features.features[thing].properties.city+", "+shp_features.features[thing].properties.county,
                population:shp_features.features[thing].properties.population,
                over64pct:shp_features.features[thing].properties.over64pct,
                lowincfpct:shp_features.features[thing].properties.lowincfpct,
                pm25:shp_features.features[thing].properties.pm25,
                cancer:shp_features.features[thing].properties.cancer,
                foodsrtpct:shp_features.features[thing].properties.foodsrtpct,
                unemppct:shp_features.features[thing].properties.unemppct,
                homelespct:shp_features.features[thing].properties.homelespct,
                housebrdn:shp_features.features[thing].properties.housebrdn,
                value:shp_features.features[thing].properties[selected_metrics[ind]] * multiplier
            }))
        }
        array_metrics[ind].sort();
        for (thing = array_metrics[ind].length - 1; thing >= 0; thing--) {
            let val = array_metrics[ind][thing];
            hashmap_metrics[ind][val] = thing;
        }
    }
    let geo_array=[];
    metrics_hashmap=hashmap_metrics;
    metrics_array=array_metrics;
    metrics_selected=selected_metrics;
    console.table(hashmap_metrics);
    let intensities=['#FFF',
    '#ADD8E6',
'#1E90FF', '#0077BE',
'#0B3D91']
    let parts = [];
    let shpSource = new ol.source.Vector({
        url:'data/DAC_UTAH_feb_14.geojson',
        'projection': map.getView().getProjection(),
        format: new ol.format.GeoJSON()
    });
    let shpLayer = new ol.layer.Vector({
        source: shpSource,
        style: function(feature) {
            return new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: 'gray',
                    width: 2,
                })
            });
        }
    });
    let featureCollection = {
        "type": "FeatureCollection",
        "features": parts
    };
    // let vectorSource = new ol.source.Vector({
    //     features: (new ol.format.GeoJSON()).readFeatures(featureCollection)
    // });
    // let vectorLayer = new ol.layer.Vector({
    //     source: vectorSource,
    //     style: function(feature) {
    //         return new ol.style.Style({
    //             fill: new ol.style.Fill({
    //                 color: feature.get("color")
    //             })
    //         });
    //     }
    // });

    let shp_end = (new Date()).getTime();
    console.log("Time taken to add Shape Layer points to array was: "+(shp_end-shp_start)/1000+" seconds");

    let poi_start = (new Date()).getTime();
    //creating feature layers
    let styles_arr = [];
    let rows=20;
    let maximum_visits=0;
    for(thing=0;thing<data1.length;thing++){
        if(metric==="visits")
            hourwise_string=data1[thing]['visits_by_day'].substring(1,data1[thing]['visits_by_day'].length-1);
        if(metric==="hours")
            hourwise_string=data1[thing]['popularity_by_hour'].substring(1,data1[thing]['popularity_by_hour'].length-1);
        const hourwise_array = hourwise_string.split(",");
        if(maximum_visits<(+hourwise_array[hour]))
            maximum_visits=hourwise_array[hour];
    }
    const poi_features=[];
    let poi_array=[];
    const lpg_features = [];
    const hy_features = [];
    const bd_features = [];
    const e85_features = [];
    const lng_features = [];
    const cng_features = [];
    //Storing all the popularities for a time for all POIs
    for (thing=data1.length-1;thing>-1;thing--){
        if(metric==="visits")
            hourwise_string=data1[thing]['visits_by_day'].substring(1,data1[thing]['visits_by_day'].length-1);
        if(metric==="hours")
            hourwise_string=data1[thing]['popularity_by_hour'].substring(1,data1[thing]['popularity_by_hour'].length-1);
        const hourwise_array = hourwise_string.split(",");
        poi_array.push(hourwise_array[hour]);
    }
    //sorted the popularities
    poi_array.sort();
    let hashed_poi_indices={};
    for (let thing=poi_array.length-1;thing>=0;thing--){
        hashed_poi_indices[poi_array[thing]]=thing;
    }
    //Got the start index for popularities
    for (let i=0;i<rows;i++) {
        styles_arr.push(
            new ol.style.Style({
                image: new ol.style.Circle({
                    radius: Math.pow(maximum_visits/(rows-i),1/3),
                    stroke:new ol.style.Stroke({color: '#000'}),
                    fill: new ol.style.Fill({color: '#FFF'})
                })
            })
        );
        // console.log(styles_arr[i]);
    }
    //OL code for a square
    // new ol.style.Style({
    //     image: new ol.style.RegularShape({
    //         radius: Math.pow(maximum_visits/(rows-i),0.4),
    //         points:4,
    //         angle: 90,
    //         stroke:new ol.style.Stroke({color: '#000'}),
    //         fill: new ol.style.Fill({color: '#FFF'})
    //     })
    // })
    //pushed the normalized styles to stylez_arr
    // svg_map.selectAll('circle').data(data1).enter().append('circle').attr('class',function(d){
    //     let pf=new ol.Feature({
    //         geometry: new ol.geom.Point(ol.proj.fromLonLat([d.longitude, d.latitude])),
    //         name: d.location_name_x,
    //         category: d.top_category,
    //         city: ""+d.city_x,
    //     })
    //     // pf.setStyle(
    //     //     new ol.style.Style({
    //     //     image: new ol.style.Circle({
    //     //         radius: (+d.popularity_by_hour[hour-1])/4,
    //     //         fill: new ol.style.Fill({color: '#000'})
    //     //     })
    //     // })
    //     // )
    //     //code to be copied start
    //     if(metric==="hours")
    //     hourwise_string=d.popularity_by_hour.substring(1,d.popularity_by_hour.length-1);
    //     if(metric==="visits")
    //         hourwise_string=d.visits_by_day.substring(1,d.visits_by_day.length-1);
    //     const hourwise_array = hourwise_string.split(",");
    //     // pf.setStyle(
    //     //     new ol.style.Style({
    //     //         image: new ol.style.RegularShape({
    //     //             radius: Math.pow((+hourwise_array[hour]+1),1/3),
    //     //             points:3,
    //     //             angle: 0,
    //     //             stroke:new ol.style.Stroke({color: '#000'}),
    //     //             fill: new ol.style.Fill({color: '#FFF'})
    //     //         })
    //     //     })
    //     // )
    //     //code to be copied end
    //     //
    //     // poi_features.push(pf);
    //     try{features_arr[Math.floor(hourwise_array[hour]*(rows-1)/(maximum_visits))].push(pf);}
    //     catch(err){
    //         console.log(Math.floor(hourwise_array[hour]*(rows-1)/(maximum_visits)));
    //     }
    //     poi_array.push(hourwise_array[hour])
    //     return 'circle';
    // })
    if(poi_features.length===0) {
        console.log("aagaye yeh power rangersss");
        let thing=0;
            for(thing=0;thing<data1.length;thing++){
            // pf.setStyle(
            //     new ol.style.Style({
            //     image: new ol.style.Circle({
            //         radius: (+d.popularity_by_hour[hour-1])/4,
            //         fill: new ol.style.Fill({color: '#000'})
            //     })
            // })
            // )
                if(metric==="visits")
            hourwise_string=data1[thing]['visits_by_day'].substring(1,data1[thing]['visits_by_day'].length-1);
                if(metric==="hours")
                    hourwise_string=data1[thing]['popularity_by_hour'].substring(1,data1[thing]['popularity_by_hour'].length-1);
            const hourwise_array = hourwise_string.split(",");
                let pf=new ol.Feature({
                    geometry: new ol.geom.Point(ol.proj.fromLonLat([data1[thing]['longitude'], data1[thing]['latitude']])),
                    name: data1[thing]['location_name_x'],
                    type: "old",
                    category: data1[thing]['top_category'],
                    city: ""+data1[thing]['city_x'],
                    index:Math.floor(hashed_poi_indices[hourwise_array[hour]]*(rows)/(poi_array.length+1))
                })
            pf.setStyle(
                styles_arr[Math.floor(hashed_poi_indices[hourwise_array[hour]]*(rows)/(poi_array.length+1))]
            )
                //code to be copied end
                // try{features_arr[Math.floor(hashed_poi_indices[hourwise_array[hour]]*(rows)/(poi_array.length+1))].push(pf);}
                // catch(err){
                //     console.log(Math.floor(hashed_poi_indices[hourwise_array[hour]]*(rows)/(poi_array.length+1)));
                // }
            poi_features.push(pf);
            }
    }
    let poi_end = (new Date()).getTime();
    console.log("Time taken to add POI points to array was: "+(poi_end-poi_start)/1000+" seconds");
    let circ_start = (new Date()).getTime();
    svg_map.selectAll('circle').remove();
    let circ_end = (new Date()).getTime();
    console.log("circle removal time is "+(circ_end-circ_start)/1000);
    let Station_start = (new Date()).getTime();
    svg_map.selectAll('circle')
        .data(data)
        .enter()
        .append('circle')
        .attr('cx', (d) => projection([d.Longitude, d.Latitude])[0])
        .attr('cy', (d) => projection([d.Longitude, d.Latitude])[1])
        .attr('class', function(d){
            if(d.color==="#1f77b4") {
                cng_features.push(new ol.Feature({
                    geometry: new ol.geom.Point(ol.proj.fromLonLat([d.Longitude, d.Latitude])),
                    name:d['Station Name'],
                    type: "old",
                    city: d['City'],
                    size: 10
                }))
            }
            if(d.color==="#ff7f0e") {
                lng_features.push(new ol.Feature({
                    geometry: new ol.geom.Point(ol.proj.fromLonLat([d.Longitude, d.Latitude])),
                    name:d['Station Name'],
                    type: "old",
                    city: d['City'],
                    size: 10
                }))
            }
            if(d.color==="#2ca02c") {
                lpg_features.push(new ol.Feature({
                    geometry: new ol.geom.Point(ol.proj.fromLonLat([d.Longitude, d.Latitude])),
                    name:d['Station Name'],
                    type: "old",
                    city: d['City'],
                    size: 10
                }))
            }
            if(d.color==="#d62728") {
                e85_features.push(new ol.Feature({
                    geometry: new ol.geom.Point(ol.proj.fromLonLat([d.Longitude, d.Latitude])),
                    name:d['Station Name'],
                    type: "old",
                    city: d['City'],
                    size: 10
                }))
            }
            if(d.color==="#9467bd") {
                bd_features.push(new ol.Feature({
                    geometry: new ol.geom.Point(ol.proj.fromLonLat([d.Longitude, d.Latitude])),
                    name:d['Station Name'],
                    type: "old",
                    city: d['City'],
                    size: 10
                }))
            }
            if(d.color==="#8c564b") {
                let ch=0;
                try{
                    ch=data2Dict[+d['ID']];
                }
                catch{
                    ch=0;
                }
                // console.log(ol.proj.fromLonLat([d.Longitude, d.Latitude]));
                elec_features.push(new ol.Feature({
                    geometry: new ol.geom.Point(ol.proj.fromLonLat([d.Longitude, d.Latitude])),
                    name:d['Station Name'],
                    type: "old",
                    city: d['City'],
                    charge: ch,
                    size: 10
                }))
                // console.log(d.Longitude,d.Latitude);
            }
            if(d.color==="#e377c2") {
                hy_features.push(new ol.Feature({
                    geometry: new ol.geom.Point(ol.proj.fromLonLat([d.Longitude, d.Latitude])),
                    name:d['Station Name'],
                    type: "old",
                    city: d['City'],
                    size: 10
                }))
            }
            return d.state;
        })
        .attr('r', () => {
            if (data.length < 8)
                return 6;
            else if (data.length < 15)
                return 5;
            else if (data.length < 25)
                return 4;
            else
                return 3;
        })
        .attr("pointer-events", ()=>{
            if(current_showing_data_name === "USA"){
                return "none";
            }
            return "all";
        })
        .style('fill', (d) => d.color)
        .style('opacity', 0.5)
        .on('mouseover', function (e, d) {
            if (current_showing_data_name !== "USA") {
                mouse_overed_station = d;
                // pop_up_display(true);
            }

        })
        .on('mouseout', () => {
            // pop_up_display(false);
        })
    let Station_end = (new Date()).getTime();
    console.log("time for adding stations data to array was: "+(Station_end-Station_start)/1000+" seconds");
    // let VectorSourcePoiGrouped=[];
    // for (let i=0;i<rows;i++){
    //     const clusterSource = new ol.source.Cluster({
    //         distance:  30,
    //         minDistance: 30,
    //         source: new ol.source.Vector({
    //             features:features_arr[i]
    //         }),
    //     })
    //    VectorSourcePoiGrouped.push(
    //        clusterSource
    //    )
    // }

    console.log(newStations);
    for(let elec_st=0;elec_st<newStations.length;elec_st++){
        elec_features.push(new ol.Feature({
            geometry: new ol.geom.Point(ol.proj.fromLonLat([newStations[elec_st][3], newStations[elec_st][2]])),
            name:newStations[elec_st][0],
            type: "old",
            city: "sample city",
            charge: newStations[elec_st][1],
            size: 10
        }))
    }
    const vectorSourcePoi = new ol.source.Vector({
        features:poi_features

    });
    const clusterSourcePoi = new ol.source.Cluster({
        distance:  30,
        minDistance: 30,
        source: new ol.source.Vector({
            features:poi_features
        }),
    })
    const vectorSourceCng = new ol.source.Vector({
        features:cng_features
    });
    const vectorSourceLng = new ol.source.Vector({
        features:lng_features
    });
    const vectorSourceLpg = new ol.source.Vector({
        features:lpg_features
    });
    const vectorSourceBd = new ol.source.Vector({
        features:bd_features
    });
    const vectorSourceStat=new ol.source.Vector({
        features:station_features
    });
    const vectorSourceElec = new ol.source.Vector({
        features:elec_features
    });
    const vectorSourceNewElec = new ol.source.Vector({
        features:new_elec_features
    });
    const vectorSourceHy = new ol.source.Vector({
        features:hy_features
    });
    const vectorSourceE85 = new ol.source.Vector({
        features:e85_features
    });

    const clusterSourceElec = new ol.source.Cluster({
        distance:  10,
        minDistance: 10,
        source: vectorSourceElec,
    });
    const clusterSourceNewElec = new ol.source.Cluster({
        distance:  10,
        minDistance: 10,
        source: vectorSourceNewElec,
    });
    const clusterSourceStat=new ol.source.Cluster({
        distance:  10,
        minDistance: 10,
        source: vectorSourceStat,
    });

    const clusterSourceHy = new ol.source.Cluster({
        distance:  10,
        minDistance: 10,
        source: vectorSourceHy,
    });

    const clusterSourceE85 = new ol.source.Cluster({
        distance:  10,
        minDistance: 10,
        source: vectorSourceE85,
    });

    const clusterSourceBd = new ol.source.Cluster({
        distance:  10,
        minDistance: 10,
        source: vectorSourceBd,
    });
    const clusterSourceLpg = new ol.source.Cluster({
        distance:  10,
        minDistance: 10,
        source: vectorSourceLpg,
    });
    const clusterSourceLng = new ol.source.Cluster({
        distance:  10,
        minDistance: 10,
        source: vectorSourceLng,
    });
    const clusterSourceCng = new ol.source.Cluster({
        distance:  10,
        minDistance: 10,
        source: vectorSourceCng,
    });
    const vectorLayerPoi = new ol.layer.Vector({
        source: clusterSourcePoi,
        style: function(feature) {
            // console.log(feature.values_.features[0].values_.index);
            // console.log("feature printed");
            const size = feature.get('features').length;
            return new ol.style.Style({
                image: styles_arr[feature.values_.features[0].values_.index].image_,
                text: new ol.style.Text({
                    text: size.toString(),
                    fill: new ol.style.Fill({
                        color: '#000'
                    })
                })
            });
        }
    });
    // let VectorLayerPoiGrouped=[];
    // for(let i=0;i<rows;i++){
    //     VectorLayerPoiGrouped.push(new ol.layer.Vector({
    //         source: VectorSourcePoiGrouped[i],
    //         // style: new ol.style.Style({
    //         //     image: new ol.style.RegularShape({
    //         //         radius: Math.pow(maximum_visits/(20-i),1/3),
    //         //         points:3,
    //         //         angle: 0,
    //         //         stroke:new ol.style.Stroke({color: '#000'}),
    //         //         fill: new ol.style.Fill({color: '#FFF'})
    //         //     })
    //         // })
    //         style: function(feature) {
    //             const size = feature.get('features').length;
    //             return new ol.style.Style({
    //                 image: new ol.style.Circle({
    //                     radius: Math.pow(maximum_visits/(20-i),1/3),
    //                     stroke:new ol.style.Stroke({color: '#000'}),
    //                     fill: new ol.style.Fill({color: '#FFF'})
    //                 }),
    //                 text: new ol.style.Text({
    //                     text: size.toString(),
    //                     fill: new ol.style.Fill({
    //                         color: '#000'
    //                     })
    //                 })
    //             });
    //         }
    //     }))
    // }
    const vectorLayerCng = new ol.layer.Vector({
        source: clusterSourceCng,
        // style: new ol.style.Style({
        //     image: new ol.style.Circle({
        //         radius: 3,
        //         fill: new ol.style.Fill({color: '#1f77b4'})
        //     })
        // }),
        style: function(feature) {
            const size = feature.get('features').length;
            return new ol.style.Style({
                image: new ol.style.RegularShape({
                    radius: 7,
                    points:4,
                    angle: Math.PI / 4,
                    stroke:new ol.style.Stroke({color: '#000'}),
                    fill: new ol.style.Fill({color: '#1f77b4'})
                }),
                text: new ol.style.Text({
                    text: size.toString(),
                    fill: new ol.style.Fill({
                        color: '#fff'
                    })
                })
            });
        }
    });
    const vectorLayerLng = new ol.layer.Vector({
        source: clusterSourceLng,
        style: function(feature) {
            const size = feature.get('features').length;
            return new ol.style.Style({
                image: new ol.style.RegularShape({
                    radius: 7,
                    points:4,
                    angle: Math.PI / 4,
                    stroke:new ol.style.Stroke({color: '#000'}),
                    fill: new ol.style.Fill({color: '#ff7f0e'})
                }),
                text: new ol.style.Text({
                    text: size.toString(),
                    fill: new ol.style.Fill({
                        color: '#fff'
                    })
                })
            });
        }
    });
    const vectorLayerHy = new ol.layer.Vector({
        source: clusterSourceHy,
        style: function(feature) {
            const size = feature.get('features').length;
            return new ol.style.Style({
                image: new ol.style.RegularShape({
                    radius: 7,
                    points:4,
                    angle: Math.PI / 4,
                    stroke:new ol.style.Stroke({color: '#000'}),
                    fill: new ol.style.Fill({color: '#e377c2'})
                }),
                text: new ol.style.Text({
                    text: size.toString(),
                    fill: new ol.style.Fill({
                        color: '#fff'
                    })
                })
            });
        }
    });
    const vectorLayerBd = new ol.layer.Vector({
        source: clusterSourceBd,
        style: function(feature) {
            const size = feature.get('features').length;
            return new ol.style.Style({
                image: new ol.style.RegularShape({
                    radius: 7,
                    points:4,
                    angle: Math.PI / 4,
                    stroke:new ol.style.Stroke({color: '#000'}),
                    fill: new ol.style.Fill({color: '#9467bd'})
                }),
                text: new ol.style.Text({
                    text: size.toString(),
                    fill: new ol.style.Fill({
                        color: '#fff'
                    })
                })
            });
        }
    });
    const vectorLayerE85 = new ol.layer.Vector({
        source: clusterSourceE85,
        style: function(feature) {
            const size = feature.get('features').length;
            return new ol.style.Style({
                image: new ol.style.RegularShape({
                    radius: 7,
                    points:4,
                    angle: Math.PI / 4,
                    stroke:new ol.style.Stroke({color: '#000'}),
                    fill: new ol.style.Fill({color: '#d62728'})
                }),
                text: new ol.style.Text({
                    text: size.toString(),
                    fill: new ol.style.Fill({
                        color: '#fff'
                    })
                })
            });
        }
    });
    const vectorLayerLpg = new ol.layer.Vector({
        source: clusterSourceLpg,
        style: function(feature) {
            const size = feature.get('features').length;
            return new ol.style.Style({
                image: new ol.style.RegularShape({
                    radius: 7,
                    points:4,
                    angle: Math.PI / 4,
                    stroke:new ol.style.Stroke({color: '#000'}),
                    fill: new ol.style.Fill({color: '#2ca02c'})
                }),
                text: new ol.style.Text({
                    text: size.toString(),
                    fill: new ol.style.Fill({
                        color: '#fff'
                    })
                })
            });
        }
    });
    const vectorLayerStat= new ol.layer.Vector({
        source: clusterSourceStat,
        style: function(feature) {
            console.log(feature.values_.features[0].values_.charge);
            const size = feature.get('features').length;
            // new ol.style.Style({
            //     image: new ol.style.RegularShape({
            //         radius: Math.pow(maximum_visits/(rows-i),0.4),
            //         points:4,
            //         angle: 90,
            //         stroke:new ol.style.Stroke({color: '#000'}),
            //         fill: new ol.style.Fill({color: '#FFF'})
            //     })
            // })
            let charge_arr = feature.values_.features;
            let charge_value = 0;
            let num = 0;
            charge_arr.forEach(function (d) {
                num = +(d.values_.charge);
                charge_value = charge_value + num;
            })
            charge_value = charge_value / charge_arr.length;
            if(feature.values_.features[0].values_.charge==='Available') {
                return new ol.style.Style({
                    image: new ol.style.Icon({
                        src: 'https://drive.google.com/uc?id=121O9wzTRfvr5PiuJWACxMZhIQHJ3OfuF',
                        scale: 0.7
                    }),

                    text: new ol.style.Text({
                        text: size.toString(),
                        fill: new ol.style.Fill({
                            color: '#fff'
                        })
                    })
                });
            }
            if(feature.values_.features[0].values_.charge==='Unavailable') {
                return new ol.style.Style({
                    image: new ol.style.Icon({
                        src: 'https://drive.google.com/uc?id=1mgsyQ-ahKI59XCNw8hQr-rXNHqGE7eyK',
                        scale: 0.7
                    }),

                    text: new ol.style.Text({
                        text: size.toString(),
                        fill: new ol.style.Fill({
                            color: '#fff'
                        })
                    })
                });
            }
            if(feature.values_.features[0].values_.charge==='Charging') {
                return new ol.style.Style({
                    image: new ol.style.Icon({
                        src: 'https://drive.google.com/uc?id=1Tp3uyJVlMNFlYt5UZbBL9HF-P5WT7Ihq',
                        scale: 0.7
                    }),

                    text: new ol.style.Text({
                        text: size.toString(),
                        fill: new ol.style.Fill({
                            color: '#fff'
                        })
                    })
                });
            }
            if(feature.values_.features[0].values_.charge==='Preparing') {
                return new ol.style.Style({
                    image: new ol.style.Icon({
                        src: 'https://drive.google.com/uc?id=16obw9VRI0rxN1S30n9RtomZh2rlgWvJ5',
                        scale: 0.7
                    }),

                    text: new ol.style.Text({
                        text: size.toString(),
                        fill: new ol.style.Fill({
                            color: '#fff'
                        })
                    })
                });
            }
        }
    });
    const vectorLayerElec = new ol.layer.Vector({
        source: clusterSourceElec,
        style: function(feature) {
            // console.log(feature.values_.features[0].values_.charge);
            const size = feature.get('features').length;
            // new ol.style.Style({
            //     image: new ol.style.RegularShape({
            //         radius: Math.pow(maximum_visits/(rows-i),0.4),
            //         points:4,
            //         angle: 90,
            //         stroke:new ol.style.Stroke({color: '#000'}),
            //         fill: new ol.style.Fill({color: '#FFF'})
            //     })
            // })
            let charge_arr = feature.values_.features;
            let charge_value = 0;
            let num = 0;
            charge_arr.forEach(function (d) {
                num = +(d.values_.charge);
                charge_value = charge_value + num;
            })
            charge_value = charge_value / charge_arr.length;
            if (charge_value <= 25) {
                return new ol.style.Style({
                    image: new ol.style.Icon({
                        src: 'https://drive.google.com/uc?id=1njRgTTRQM2FSsT_4E6pHmv3wAmF6KJ9x',
                        scale: 0.3
                    }),
                    text: new ol.style.Text({
                        text: size.toString(),
                        fill: new ol.style.Fill({
                            color: '#000'
                        })
                    })
                });
            }
            if (charge_value <= 50) {
                return new ol.style.Style({
                    image: new ol.style.Icon({
                        src: 'https://drive.google.com/uc?id=1-hCGQhvovXkPYkKo3hN_ro4m56Y891wZ',
                        scale: 0.3
                    }),
                    text: new ol.style.Text({
                        text: size.toString(),
                        fill: new ol.style.Fill({
                            color: '#000'
                        })
                    })
                });
            }
            if (charge_value <= 75) {
                return new ol.style.Style({
                    image: new ol.style.Icon({
                        src: 'https://drive.google.com/uc?id=1Ph3JAcnkKoA9cRXiUvXN4CDKyk3m1VAS',
                        scale: 0.3
                    }),
                    text: new ol.style.Text({
                        text: size.toString(),
                        fill: new ol.style.Fill({
                            color: '#000'
                        })
                    })
                });
            }

            if (charge_value <= 100) {
                return new ol.style.Style({
                    image: new ol.style.Icon({
                        src: 'https://drive.google.com/uc?id=1g45LUbNX56l5DSEb-LR0wHm1oy_Rpzpp',
                        scale: 0.3
                    }),

                    text: new ol.style.Text({
                        text: size.toString(),
                        fill: new ol.style.Fill({
                            color: '#fff'
                        })
                    })
                });
            }
            return new ol.style.Style({
                image: new ol.style.Icon({
                    src: 'https://drive.google.com/uc?id=1ntcdrtmcZ35fxgUJYfIRWd4Zu7riDHDf',
                    scale: 1.0
                }),

                text: new ol.style.Text({
                    text: 'API',
                    fill: new ol.style.Fill({
                        color: '#fff'
                    })
                })
            });
        }
    });

    const vectorLayerNewElec = new ol.layer.Vector({
        source: clusterSourceNewElec,
        style: function(feature) {
            // console.log(feature.values_.features[0].values_.charge);
            const size = feature.get('features').length;
            // new ol.style.Style({
            //     image: new ol.style.RegularShape({
            //         radius: Math.pow(maximum_visits/(rows-i),0.4),
            //         points:4,
            //         angle: 90,
            //         stroke:new ol.style.Stroke({color: '#000'}),
            //         fill: new ol.style.Fill({color: '#FFF'})
            //     })
            // })
            let charge_arr = feature.values_.features;
            let charge_value = 0;
            let num = 0;
            charge_arr.forEach(function (d) {
                num = +(d.values_.charge);
                charge_value = charge_value + num;
            })
            charge_value = charge_value / charge_arr.length;
            if (charge_value <= 25) {
                return new ol.style.Style({
                    image: new ol.style.Icon({
                        src: 'https://drive.google.com/uc?id=1XrzB4WMH1K2aC_U7OUwT4c3OI3Fk1PKx',
                        scale: 0.1
                    }),
                    text: new ol.style.Text({
                        text: size.toString(),
                        fill: new ol.style.Fill({
                            color: '#000'
                        })
                    })
                });
            }
            if (charge_value <= 50) {
                return new ol.style.Style({
                    image: new ol.style.Icon({
                        src: 'https://drive.google.com/uc?id=1M-ZogZsMxvGba-_2RqIcbQpTVhKs5gi7',
                        scale: 0.1
                    }),
                    text: new ol.style.Text({
                        text: size.toString(),
                        fill: new ol.style.Fill({
                            color: '#000'
                        })
                    })
                });
            }
            if (charge_value <= 75) {
                return new ol.style.Style({
                    image: new ol.style.Icon({
                        src: 'https://drive.google.com/uc?id=1NA666AeydyWXqHaSLACAdMeVPeTU4JcS',
                        scale: 0.1
                    }),
                    text: new ol.style.Text({
                        text: size.toString(),
                        fill: new ol.style.Fill({
                            color: '#000'
                        })
                    })
                });
            }

            if (charge_value <= 100) {
                return new ol.style.Style({
                    image: new ol.style.Icon({
                        src: 'https://drive.google.com/uc?id=1ZD0kKpflxBrTOmWNeUQTfohIaDYAFsr6',
                        scale: 0.1
                    }),

                    text: new ol.style.Text({
                        text: size.toString(),
                        fill: new ol.style.Fill({
                            color: '#fff'
                        })
                    })
                });
            }
            return new ol.style.Style({
                image: new ol.style.Icon({
                    src: 'https://drive.google.com/uc?id=1ntcdrtmcZ35fxgUJYfIRWd4Zu7riDHDf',
                    scale: 1.0
                }),

                text: new ol.style.Text({
                    text: 'API',
                    fill: new ol.style.Fill({
                        color: '#fff'
                    })
                })
            });
        }
    });
    // sleep(1000).then(() => {
    // console.log(geojson_features.length);
    // });
    const vectorSourceGeojson = new ol.source.Vector({
        features:geojson_features
    });
    const clusterSourceGeojson = new ol.source.Cluster({
        distance:  60,
        minDistance: 60,
        source: vectorSourceGeojson,
    });
    const vectorLayerGeojson = new ol.layer.Vector({
        source: clusterSourceGeojson,
        style: function(feature) {
            console.log(feature);
            console.log("hi");
            let c_hue = [];
            let dat_array = [];
            for (let ind = 0; ind < selected_metrics.length; ind++) {
                let mul = 1;
                let value_sum = 0;
                for (let feat = 0; feat < feature.values_.features.length; feat++) {
                    if (selected_metrics[ind] === 'lowincfpct') {
                        mul = feature.values_.features[feat].values_['population'];
                    }
                    value_sum = value_sum + hashmap_metrics[ind][feature.values_.features[feat].values_[selected_metrics[ind]] * mul] / array_metrics[ind].length;
                }
                let value = value_sum / feature.values_.features.length;
                let c = c_palette[ind]
                dat_array.push(value * 100);
                let color = 'transparent';
                // let value = feature.values_[selected_metrics[ind]];
                if (value <= 0.2)
                    color = 'rgba(' + c + ',0.2)';
                else if (value <= 0.4)
                    color = 'rgba(' + c + ',0.4)';
                else if (value <= 0.6)
                    color = 'rgba(' + c + ',0.6)';
                else if (value <= 0.8)
                    color = 'rgba(' + c + ',0.8)';
                else if (value > 0.8)
                    color = 'rgba(' + c + ',1.0)';
                c_hue.push(color);
            }
            for (let ind = selected_metrics.length; ind < 9; ind++) {
                c_hue.push('transparent');
            }

            if (selected_viz === 'radar') {
                let label_array = selected_metrics;
                const data = {
                    labels: label_array,
                    datasets: [
                        {
                            label: 'Dataset 1',
                            data: dat_array,
                            pointBackgroundColor: ['rgb(255, 0, 0)', 'rgb(0, 255, 0)', 'rgb(0, 0, 255)', 'rgb(255, 255, 0)', 'rgb(255, 0, 255)', 'rgb(0, 255, 255)', 'rgb(128, 0, 128)', 'rgb(255, 165, 0)', 'rgb(0, 128, 128)'],
                            backgroundColor: 'gray',
                            borderColor: 'black',
                            borderWidth: 1,
                        },
                    ],
                };

                // Create a canvas element to render the radar chart
                const canvas = document.createElement('canvas');
                canvas.width = 90;
                canvas.height = 90;

                // Get the 2D context of the canvas
                const ctx = canvas.getContext('2d');

                // Create a new radar chart instance
                new Chart(ctx, {
                    type: 'radar',
                    data: data,
                    options: {
                        layout: {
                            padding: 5
                        },
                        responsive: false, // Disable responsiveness
                        maintainAspectRatio: false, // Disable aspect ratio
                        animation: false, // Disable animation
                        scales: {
                            r: {
                                angleLines: {
                                    display: true, // Show angle lines
                                },
                                grid: {
                                    display: true, // Show grid lines
                                },
                                ticks: {
                                    display: false, // Hide tick labels
                                },
                                pointLabels: {
                                    display: false,//Hide the labels
                                },
                            },
                        },
                        plugins: {
                            legend: {
                                display: false, // Hide legend
                            },
                        },
                        interaction: {
                            mode: 'nearest', // Disable hover interactions
                        },
                    },
                });

                // Create an OpenLayers style with the canvas as the icon
                const style = new ol.style.Style({
                    image: new ol.style.Icon({
                        img: canvas,
                        imgSize: [canvas.width, canvas.height]
                    })
                });

                return style;
            }
            if(selected_viz==='polar'){
                let label_array = selected_metrics;
                const data = {
                    labels: label_array,
                    datasets: [
                        {
                            label: 'Dataset 1',
                            data: dat_array,
                            backgroundColor: ['rgb(255, 0, 0)', 'rgb(0, 255, 0)', 'rgb(0, 0, 255)', 'rgb(255, 255, 0)', 'rgb(255, 0, 255)', 'rgb(0, 255, 255)', 'rgb(128, 0, 128)', 'rgb(255, 165, 0)', 'rgb(0, 128, 128)'],
                            borderColor: 'black',
                            borderWidth: 1,
                        },
                    ],
                };
                const canvas = document.createElement('canvas');
                canvas.width = 60;
                canvas.height = 60;
                const ctx = canvas.getContext('2d');
                new Chart(ctx, {
                    type: 'polarArea',
                    data: data,
                    options: {
                        responsive: false, // Disable responsiveness
                        maintainAspectRatio: false, // Disable aspect ratio
                        animation: false, // Disable animation,
                        plugins: {
                            legend: {
                                display: false, // Hide legend
                            },
                        },
                        interaction: {
                            mode: 'nearest', // Disable hover interactions
                        },
                    },
                    scale: {
                        ticks: {
                            beginAtZero: true,
                            display:false,
                        },
                        radial: {
                            display:false,
                        },
                        pointLabels: {
                            display: false // Hide the labels
                        }
                    },
                    legend: {
                        display: false
                    }
                });

                // Create an OpenLayers style with the canvas as the icon
                const style = new ol.style.Style({
                    image: new ol.style.Icon({
                        img: canvas,
                        imgSize: [canvas.width, canvas.height]
                    })
                });

                return style;
            }
            if(selected_viz==='pie'){
                let label_array = selected_metrics;
                const data = {
                    labels: label_array,
                    datasets: [
                        {
                            label: 'Dataset 1',
                            data: dat_array,
                            backgroundColor: ['rgb(255, 0, 0)', 'rgb(0, 255, 0)', 'rgb(0, 0, 255)', 'rgb(255, 255, 0)', 'rgb(255, 0, 255)', 'rgb(0, 255, 255)', 'rgb(128, 0, 128)', 'rgb(255, 165, 0)', 'rgb(0, 128, 128)'],
                            borderColor: 'black',
                            borderWidth: 1,
                        },
                    ],
                };
                const canvas = document.createElement('canvas');
                canvas.width = 60;
                canvas.height = 60;
                const ctx = canvas.getContext('2d');
                new Chart(ctx, {
                    type: 'pie',
                    data: data,
                    options: {
                        responsive: false, // Disable responsiveness
                        maintainAspectRatio: false, // Disable aspect ratio
                        animation: false, // Disable animation,
                        plugins: {
                            legend: {
                                display: false, // Hide legend
                            },
                        },
                        interaction: {
                            mode: 'nearest', // Disable hover interactions
                        },
                    },
                    scale: {
                        ticks: {
                            beginAtZero: true
                        }
                    },
                    legend: {
                        display: false
                    }
                });

                // Create an OpenLayers style with the canvas as the icon
                const style = new ol.style.Style({
                    image: new ol.style.Icon({
                        img: canvas,
                        imgSize: [canvas.width, canvas.height]
                    })
                });

                return style;
            }
            if(selected_viz==='pattern'){
                const canvas = document.createElement("canvas");
                const patternCanvas = document.createElement("canvas");
                patternCanvas.width = 10;
                patternCanvas.height = 10;
                const ctx = canvas.getContext("2d");
                for (let i = 0; i < 3; i++) {
                    for (let j = 0; j < 3; j++) {
                        ctx.fillStyle =c_hue[3*i+j];
                        ctx.fillRect(j * patternCanvas.width, i * patternCanvas.height, patternCanvas.width, patternCanvas.height);
                    }
                }
                // const pattern = ctx.createPattern(canvas,'repeat');
                return new ol.style.Style({
                    image: new ol.style.Icon({
                        img: canvas,
                        imgSize: [30,30]
                    })
                });
            }
        }
    });
    const layers=[shpLayer];
    let osm=new ol.layer.Tile({
        source: new ol.source.OSM()
    });
    osm.setOpacity(0.25);
    layers.push(osm);
    layers.push(vectorLayerGeojson);
    // layers.push(vectorLayer);
    // for(let i=0;i<rows;i++){
    //     layers.push(VectorLayerPoiGrouped[i]);
    // }
    if(showPoi)
    layers.push(vectorLayerPoi);
    if(showNewElec)
    layers.push(vectorLayerNewElec);
    if(show_chargers)
    layers.push(vectorLayerStat);
    if (selectedFuelTypes['cng']){
        layers.push(vectorLayerCng)
    }
    if (selectedFuelTypes['lng']){
        layers.push(
            vectorLayerLng)
    }
    if (selectedFuelTypes['lpg']){
        layers.push(
            vectorLayerLpg)
    }
    if (selectedFuelTypes['hy']){
        layers.push(
            vectorLayerHy)
    }
    if (selectedFuelTypes['bd']){
        layers.push(
            vectorLayerBd)
    }
    if (selectedFuelTypes['elec']){
        layers.push(
            vectorLayerElec)
    }
    if (selectedFuelTypes['e85']){
        layers.push(
            vectorLayerE85)
    }
    const layerGroup= new ol.layer.Group({
        layers:layers
    })
    // const map = new ol.Map({
    //     target: 'js-map',
    //     view: new ol.View({
    //         center: center,
    //         zoom: zoom,
    //     })
    // });
    map.setLayerGroup(layerGroup);
    let max_data = 0;
    Object.keys(selectedFuelTypes).forEach((keys, i) => {
        if (selectedFuelTypes[keys]) {
            const year_list = Object.keys(allData_count[keys]);

            for (let i_year = 0; i_year < year_list.length; i_year++) {
                if (max_data < allData_count[keys][year_list[i_year]][current_showing_state_postal]) {
                    max_data = allData_count[keys][year_list[i_year]][current_showing_state_postal];
                }
            }
        }
    })
    key_list = [];
        Object.keys(selectedFuelTypes).forEach((keys, i) => {
            if (selectedFuelTypes[keys]) {
                // linearChart(allData_count[keys], keys, current_showing_state_postal, colors[keys],svg_time_slider);
                key_list.push(keys);
            }
        })
    let feature_onClick;
    map.on('click', function(evt) {
        let pop=document.getElementById('popup');
        pop.style.display="block";
        console.log(evt.coordinate);
        station_coordinates=evt.coordinate;
        feature_onClick = map.forEachFeatureAtPixel(evt.pixel, function (feature, shpLayer) {
            console.log(feature);
            let barchartPopup = document.getElementById("popup_barchart");
            barchartPopup.style.left=evt.pointerEvent.clientX+40+'px';
            barchartPopup.style.top=evt.pointerEvent.clientY+40+'px';
            console.log(map.getView().getCenter());
            console.log(feature);
            let geojsonStr = feature.values_;
            console.log(geojsonStr);
            console.log(metrics_selected[0]);
            console.log(metrics_hashmap);
            console.log(metrics_array);
            let bars=[];
            for(let ind=0;ind<metrics_selected.length;ind++){
                let mul = 1;
                let value_sum=0;
                for(let feat=0;feat<feature.values_.features.length;feat++){
                    if (selected_metrics[ind] === 'lowincfpct') {
                        mul = feature.values_.features[feat].values_['population'];
                    }
                    value_sum= value_sum+feature.values_.features[feat].values_[selected_metrics[ind]] * mul;
                }
                let value=value_sum/feature.values_.features.length;
                console.log(value);
                bars.push(metrics_hashmap[ind][value]/metrics_array[ind].length);
            }
            console.log(bars);
            console.log(geojsonStr);
            drawBarChart(bars,metrics_selected,geojsonStr.city);
            console.log(metrics_selected);
            console.log(feature.values_);
            console.log(feature);
            myExtent = map.getView().calculateExtent(map.getSize());
            zoom=map.getView().getZoom();
            center=map.getView().getCenter();
            let popup = document.getElementById("myPopup");
            let mainPopup = document.getElementById("popup");
            // popup.classList.toggle("show");
            // console.log(data2Dict[feature.values_.city]['population']+feature.values_.city);
            console.log(evt.pixel_);
            let to_be_added="";
            // $('input:checkbox').each(function () {
            //     if ($(this)[0].id === "population")
            //     {
            //         {
            //             if($(this).is(':checked'))
            //                 to_be_added=to_be_added+"\nPop: "+data2Dict[feature.values_.city][$(this).val()]+"\n";
            //         }
            //     }
            //     if ($(this)[0].id === "race")
            //     {
            //         {
            //             if($(this).is(':checked'))
            //                 to_be_added=to_be_added+"\nRace: "+data2Dict[feature.values_.city][$(this).val()]+"\n";
            //         }
            //     }
            //     if ($(this)[0].id === "age")
            //     {
            //         {
            //             if($(this).is(':checked'))
            //                 to_be_added=to_be_added+"\nAge: "+data2Dict[feature.values_.city][$(this).val()]+"\n";
            //         }
            //     }
            //     if ($(this)[0].id === "sex")
            //     {
            //         {
            //             if($(this).is(':checked'))
            //                 to_be_added=to_be_added+"\nSex: "+data2Dict[feature.values_.city][$(this).val()]+"\n";
            //         }
            //     }
            //     if ($(this)[0].id === "poverty")
            //     {
            //         {
            //             if($(this).is(':checked'))
            //                 to_be_added=to_be_added+"\nPvr: "+data2Dict[feature.values_.city][$(this).val()]+"\n";
            //         }
            //     }
            //     if ($(this)[0].id === "cancer")
            //     {
            //         {
            //             if($(this).is(':checked'))
            //                 to_be_added=to_be_added+"\nCancer Risk: "+data2Dict[feature.values_.city][$(this).val()]+"\n";
            //         }
            //     }
            //     if ($(this)[0].id === "food")
            //     {
            //         {
            //             if($(this).is(':checked'))
            //                 to_be_added=to_be_added+"\nFood Desert: "+data2Dict[feature.values_.city][$(this).val()]+"\n";
            //         }
            //     }
            //     if ($(this)[0].id === "unemployment")
            //     {
            //         {
            //             if($(this).is(':checked'))
            //                 to_be_added=to_be_added+"\nUnemployment: "+data2Dict[feature.values_.city][$(this).val()]+"\n";
            //         }
            //     }
            //     if ($(this)[0].id === "income")
            //     {
            //         {
            //             if($(this).is(':checked'))
            //                 to_be_added=to_be_added+"\nIncome: "+data2Dict[feature.values_.city][$(this).val()]+"\n";
            //         }
            //     }
            //     if ($(this)[0].id === "homeless")
            //     {
            //         {
            //             if($(this).is(':checked'))
            //                 to_be_added=to_be_added+"\nHomeless pct: "+data2Dict[feature.values_.city][$(this).val()]+"\n";
            //         }
            //     }
            //     if ($(this)[0].id === "housing")
            //     {
            //         {
            //             if($(this).is(':checked'))
            //                 to_be_added=to_be_added+"\nHousing Burden: "+data2Dict[feature.values_.city][$(this).val()]+"\n";
            //         }
            //     }
            // })
            try{popup.innerHTML="Place Name: "+feature.values_.features[0].values_.name;
                console.log(feature.values_.features[0].values_.name);
                console.log(new_elec_features);
                if(feature.values_.features[0].values_.type==="new"){
                    document.getElementById("delete_station").style.display="block";
                }
                else{
                    document.getElementById("delete_station").style.display="none";
                }
                        new_name=feature.values_.features[0].values_.name;
                            new_charge=feature.values_.features[0].values_.charge;
                            new_geometry=feature.values_.features[0].values_.geometry;

                }
            catch(e){
                drawBarChart(bars,metrics_selected,geojsonStr.city);
                console.log(e);
            }

            mainPopup.style.left=evt.pointerEvent.clientX+40+'px';
            mainPopup.style.top=evt.pointerEvent.clientY-20+'px';
            console.log(feature);
            // document.getElementById("Place_id").innerHTML=feature.values_.features[0].values_.name;
            //document.getElementById("metric_value").innerHTML=Math.pow(feature.style_.image_.radius_,3);
            return feature;
        });
    });
    // draw_bar_chart();
    // chnage_accumulate_year();
    let milliseconds_end = (new Date()).getTime();
    console.log("time taken was "+(milliseconds_end-milliseconds_start)/1000+" seconds!");
}


function drawOpenLayersMap()  {
    const map=new ol.Map({
        view: new ol.View({
            center:[
                -11719546.459002854,
                10409068.786668476
            ],
            zoom: 3
        }),
        layers: [
            new ol.layer.Tile({
                source: new ol.source.OSM()
            })
        ],
        target: "js-map"
    })
    map.on('click',function (e){
        console.log(e);
  })
    const features = [];

}

// https://github.com/deldersveld/topojson/tree/master/countries/us-states
function drawMap() {
    // let mapData = topojson.feature(showing_map_data, showing_map_data.objects[Object.keys(showing_map_data.objects)[0]]);
    projection = d3.geoMercator().scale(1).translate([0, 0]);
    let path = d3.geoPath().projection(projection);
    let bounds = path.bounds(showing_map_data);
    let scale = .95 / Math.max((bounds[1][0] - bounds[0][0]) / width,
        (bounds[1][1] - bounds[0][1]) / height);
    let translation = [(width - scale * (bounds[1][0] + bounds[0][0])) / 2,
        (height - scale * (bounds[1][1] + bounds[0][1])) / 2];

    // Update the projection to use computed scale and translation.
    projection
        .scale(scale)
        .translate(translation);

    svg_map_group
        .selectAll('.map_part')
        .data(showing_map_data.features)
        .join(
            function (enter) {
                return enter
                    .append('path')
                    .attr('d', path)

            }, function (update) {
                return update
            }, function (exit) {
                return exit.remove();
            }
        )
        .attr('class', 'map_part')
        .attr('d', path)
        .style('fill', 'white')
        .style('stroke',  (d) => {
            if(mouse_overed_state_on_bar === d.properties.iso_3166_2){
                return "red";
            }
            return "black";
        })
        .style('stroke-width', (d)=>{
            if(mouse_overed_state_on_bar === d.properties.iso_3166_2){
                return 5;
            }
            return 1;
        })
        .on('mouseover', function (e, d) {
            if (current_showing_data_name === "USA") {
                mouse_overed_state_full_name = d.properties.name;
                mouse_overed_state_postal = d.properties.iso_3166_2;
                mouse_overed_state_id = name_to_code_dict[stateNameProcessing(mouse_overed_state_full_name)];
                // pop_up_display(true);
                drawStateHighlight();

            }

        })
        .on('mouseout', () => {
            // pop_up_display(false);
            // svg_bar_chart.selectAll("#high_light_rect").remove();

        })
        .on('click', (e, d) => {

            if (current_showing_data_name === "USA") {
                mouse_overed_state_full_name = d.properties.name;
                current_showing_state_postal = d.properties.iso_3166_2;
                mouse_overed_state_id = name_to_code_dict[stateNameProcessing(mouse_overed_state_full_name)];

                // document.getElementById("main_title_h2").innerHTML = "Alternative Fuel Stations Construction in the " + mouse_overed_state_full_name;
                // document.getElementById("construction_h3").innerHTML = "Yearly construction for the " + mouse_overed_state_full_name;
                // document.getElementById("policy_h3").innerHTML = "New Policy for the " + mouse_overed_state_full_name;

                svg_map.selectAll('circle').remove()
                current_showing_data_name = mouse_overed_state_full_name;
                getMapData(mouse_overed_state_id).then(() => {
                    drawMap();
                    drawStations();
                });

            }
        });

}

function init() {
    let temp_metrics=[];
    $("#checkbox-list").sortable(
        {
            update: function() {
                let sortedList = document.getElementById("checkbox-list");
                console.log(sortedList);
                let listElements = sortedList.querySelectorAll("input");
                for(let thing=0;thing<listElements.length;thing++){
                    if(listElements[thing].checked)
                        temp_metrics.push(listElements[thing].value);
                }
                metrics_selected=temp_metrics;
                drawStations();
            }
        }
    );

    $("#checkbox-list").disableSelection();
    let barchartPopup = document.getElementById("popup_barchart");
    barchartPopup.style.display="none";
    // let c_palette = ['255, 0, 0', '0, 255, 0', '0, 0, 255', '255, 255, 0', '255, 0, 255', '0, 255, 255', '128, 0, 128', '255, 165, 0', '0, 128, 128'];
    // v_arr=[0.1,0.3,0.5,0.7,0.9];
    // for(let i=0;i<9;i++) {
    //     let ind=0;
    //     let c_hue=[];
    //     for (ind = 0; ind < i + 1; ind++) {
    //         for (let j = 0; j < 5; j++) {
    //             let value = v_arr[j];
    //             let c = c_palette[ind]
    //             let color = 'transparent';
    //             // let value = feature.values_[selected_metrics[ind]];
    //             if (value <= 0.2)
    //                 color = 'rgba(' + c + ',0.2)';
    //             else if (value <= 0.4)
    //                 color = 'rgba(' + c + ',0.4)';
    //             else if (value <= 0.6)
    //                 color = 'rgba(' + c + ',0.6)';
    //             else if (value <= 0.8)
    //                 color = 'rgba(' + c + ',0.8)';
    //             else if (value > 0.8)
    //                 color = 'rgba(' + c + ',1.0)';
    //             c_hue.push(color);
    //             while (ind < 9) {
    //                 c_hue.push('transparent');
    //                 ind++;
    //             }
    //             const canvas = document.createElement("canvas");
    //             const patternCanvas = document.createElement("canvas");
    //             patternCanvas.width = 10;
    //             patternCanvas.height = 10;
    //             const ctx = canvas.getContext("2d");
    //             for (let i = 0; i < 3; i++) {
    //                 for (let j = 0; j < 3; j++) {
    //                     ctx.fillStyle = c_hue[3 * i + j];
    //                     ctx.fillRect(j * patternCanvas.width, i * patternCanvas.height, patternCanvas.width, patternCanvas.height);
    //                 }
    //             }
    //             // Convert the canvas to a PNG image
    //             const dataURL = canvas.toDataURL('image/png');
    //
    //             // Create a link element to download the image
    //             const link = document.createElement('a');
    //             link.href = dataURL;
    //             link.download = `pattern_${i + 1}_${ind + 1}_${j + 1}.png`; // Adjust the filename as needed
    //             link.style.display = 'none';
    //
    //             // Append the link to the document body and trigger the download
    //             document.body.appendChild(link);
    //             link.click();
    //
    //             // Clean up
    //             document.body.removeChild(link);
    //         }
    //     }
    // }
    map.on('moveend', drawStations());
    map.on('postrender', drawStations());
    // var docs = document.getElementsByClassName('btn');
    // for (var i = 0; i < docs.length; i++) {
    //     (function() {
    //         var doc = docs[i];
    //         doc.addEventListener('click', function() {
    //             if (!doc.classList.contains("pressed")) {
    //                 // Toggle the 'pressed' class on the button
    //                 doc.classList.toggle('pressed');
    //                 if(doc.id==="pan"){
    //                     cancel();
    //                     let elem=document.getElementById("station");
    //                     if(elem.classList.contains("pressed")){
    //                         elem.classList.toggle("pressed");
    //                     }}
    //                 if(doc.id==="station"){
    //                     cancel_pan();
    //                    let elem=document.getElementById("pan")
    //                     if(elem.classList.contains("pressed")){
    //                         elem.classList.toggle("pressed");
    //                     }
    //                 }
    //             }
    //             if(doc.classList.contains("pressed")){
    //                 if(doc.id==="station")
    //                 cancel();
    //                 if(doc.id==="pan")
    //                     cancel_pan();
    //             }
    //         });
    //     })();
    // }
    let elem_station=document.getElementById("station");
    elem_station.addEventListener('click', function(){
        console.log("clicked station button");
        if(elem_station.classList.contains("pressed")){
            let elem_pan=document.getElementById("pan");
            if(elem_pan.classList.contains("pressed"))
                elem_pan.classList.toggle("pressed");
            cancel();
            cancel_pan();
        }
        if(!elem_station.classList.contains("pressed")){
            let elem_pan=document.getElementById("pan");
            if(elem_pan.classList.contains("pressed"))
                elem_pan.classList.toggle("pressed");
            cancel_pan();
        }
        elem_station.classList.toggle("pressed");
        console.log(elem_station.classList);
    })

    let elem_pan=document.getElementById("pan");
    elem_pan.addEventListener('click', function(){
        console.log("clicked pan button");
        if(elem_pan.classList.contains("pressed")){
            cancel_pan();
            let elem_station=document.getElementById("station");
            if(elem_station.classList.contains("pressed"))
                elem_station.classList.toggle("pressed");
            cancel();
        }
        if(!elem_pan.classList.contains("pressed")){
            let elem_station=document.getElementById("station");
            if(elem_station.classList.contains("pressed"))
                elem_station.classList.toggle("pressed");
            cancel();
        }
        elem_pan.classList.toggle("pressed");
        console.log(elem_pan.classList);
    })
    $("#popup_add_st").draggable();
    $("#popup_metric").draggable();
    document.getElementById("poi_hour").defaultValue = "10";
    getMapData("USA").then(() => {
            current_showing_data_name = "USA";
            current_showing_state_postal = "USA";
            drawMap();
           // init_for_map();
        let popup = document.getElementById("myPopup");
        popup.classList.toggle("show");
            drawStations();
            // document.getElementById("main_title_h2").innerHTML = "Alternative Fuel Stations Construction in the U.S.";
        // document.getElementById("construction_h3").innerHTML = "Yearly construction for the U.S.";
        // document.getElementById("policy_h3").innerHTML = "New Policy for the U.S.";

        }
    );
    myExtent = [
        -12553481.8104441,
        4866886.776642518,
        -12322948.771123363,
        5097419.815963253
    ];
}

d3.json('data/DAC_UTAH_feb_14.geojson').then( (data) => {
    loadTiles(data);
})

d3.csv('data/full_csv.csv').then( (data) => {
     loadPoi(data);
})

d3.csv('data/elec-batteries.csv').then( (data) => {
    loadCharge(data);
})

d3.csv('data/Utah_city_stats.csv').then( (data) => {
     loadCityData(data);
});

d3.csv('data/cng_Utah.csv').then((data) => {
    loadData(data, 'cng');
});

d3.csv('data/lng_Utah.csv').then((data) => {
    loadData(data, 'lng');
});

d3.csv('data/lpg_Utah.csv').then((data) => {
    loadData(data, 'lpg');
});

d3.csv('data/e85_Utah.csv').then((data) => {
    loadData(data, 'e85');
});

d3.csv('data/elec_Utah.csv').then((data) => {
    loadData(data, 'elec');
});

d3.csv('data/bd_Utah.csv').then((data) => {
    loadData(data, 'bd');
});

d3.csv('data/hy_Utah.csv').then((data) => {
    loadData(data, 'hy');
});

d3.csv('data/laws.csv').then((data)=>{
    loadData_law(data);
})

function sleep (time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}
sleep(5000).then(() => {
    init();
});

$(document).ready(function () {
    //colors from the seaborn tab10 color pallette

    // document.getElementById('cng_label').style.background = colors['cng'];
    // document.getElementById('lng_label').style.background = colors['lng'];
    // document.getElementById('lpg_label').style.background = colors['lpg'];
    // document.getElementById('e85_label').style.background = colors['e85'];
    // document.getElementById('bd_label').style.background = colors['bd'];
    // document.getElementById('elec_label').style.background = colors['elec'];
    // document.getElementById('hy_label').style.background = colors['hy'];
    // document.getElementById('time-control-slider').addEventListener('slider', (event) => {
    //     visibleRange = [event.detail[0], event.detail[1]];
    //     drawStations();
    // });

    $(document).on('change', 'input[class="fuel_type"]', function () {
        //svg_time_slider.selectAll('line').remove();
        svg_time_slider.selectAll('.lineChartLine').remove();
        svg_law_linear_graph.selectAll('.lineChartLine').remove();
        // svg_time_slider.selectAll("#xTicks_minor_slider").remove();

        // $('input:checkbox').each(function () {
        //     if($(this)[0].id === "cng"
        //         || $(this)[0].id === "lng"
        //         || $(this)[0].id === "lpg"
        //         || $(this)[0].id === "e85"
        //         || $(this)[0].id === "bd"
        //         || $(this)[0].id === "elec"
        //         || $(this)[0].id === "hy"
        //     ){
        //         selectedFuelTypes[$(this).val()] = $(this).is(':checked');
        //
        //     }
        // });
        drawStations();
        // draw_bar_chart();
    });
});
