let width = document.body.clientWidth * 0.64;
let height = 500;
let file_location = 'data/stations.csv';
let svg_map = d3.select('#stations-over-time-viz').append('svg')
    .attr('width', width)
    .attr('height', height);

let projection = d3.geoMercator()
    .scale(1)
    .translate([0, 0]);

let path = d3.geoPath()
    .projection(projection);

let allData = {};
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

let visibleRange = [2020, 2021];
let visibleStations = [];

let selectedFuelTypes = {
    'cng': false,
    'lng': false,
    'lpg': false,
    'e85': false,
    'bd': false,
    'elec': false,
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


function loadData(data, name) {
    data = data.filter((item) => {
        return ['HI', 'AK', 'PR'].includes(item.State) === false;
    });

    data.forEach((d) => {
        d['Open Date'] = d3.timeParse("%m/%d/%Y")(d['Open Date']);
        d['color'] = colors[name];
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

function init() {
    let data = [];
    
    for (let year = 1995; year <= 2022; ++year) {
        cngData[year] = allData['cng'][year];
        lngData[year] = allData['lng'][year];
        lpgData[year] = allData['lpg'][year];
        e85Data[year] = allData['e85'][year];
        bdData[year] = allData['bd'][year];
        elecData[year] = allData['elec'][year];
        hyData[year] = allData['hy'][year];
        
        data = data.concat(allData['cng'][year]);
        data = data.concat(allData['lng'][year]);
        data = data.concat(allData['lpg'][year]);
        data = data.concat(allData['e85'][year]);
        data = data.concat(allData['bd'][year]);
        data = data.concat(allData['elec'][year]);
        data = data.concat(allData['hy'][year]);
    }
    
    svg.selectAll('circle')
        .data(data)
        .enter()
        .append('circle')
        .attr('cx', (d) => projection([d.Longitude, d.Latitude])[0])
        .attr('cy', (d) => projection([d.Longitude, d.Latitude])[1])
        .attr('class',(d) => d.State)
        .attr('r', 3)
        .style('fill', (d) => d.color)
        .style('opacity', 0.0);
}

function drawStations() {
    let startYear = visibleRange[0];
    let endYear = visibleRange[1];

    if (startYear < 1995)
        startYear = 1995;
    if (endYear > 2022)
        endYear = 2022;

    d3.select('#year-label').text(startYear + ' - ' + endYear);

    let data = [];

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

    svg_map.selectAll('circle').remove();
    svg_map.selectAll('circle')
        .data(data)
        .enter()
        .append('circle')
        .attr('cx', (d) => projection([d.Longitude, d.Latitude])[0])
        .attr('cy', (d) => projection([d.Longitude, d.Latitude])[1])
        .attr('class', (d) => d.State)
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
        .style('opacity', 0.4)
        .on('mouseover', function (e, d) {
            if (current_showing_data_name !== "USA") {
                mouse_overed_station = d;
                pop_up_display(true);
            }

        })
        .on('mouseout', () => {
            pop_up_display(false);
        })

    max_data = 0;
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
                linearChart(allData_count[keys], keys, current_showing_state_postal, colors[keys],svg_time_slider);
                key_list.push(keys);
            }
        })

    draw_bar_chart();
    chnage_accumulate_year();
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
                pop_up_display(true);
                drawStateHighlight();

            }

        })
        .on('mouseout', () => {
            pop_up_display(false);
            svg_bar_chart.selectAll("#high_light_rect").remove();

        })
        .on('click', (e, d) => {

            if (current_showing_data_name === "USA") {
                mouse_overed_state_full_name = d.properties.name;
                current_showing_state_postal = d.properties.iso_3166_2;
                mouse_overed_state_id = name_to_code_dict[stateNameProcessing(mouse_overed_state_full_name)];

                document.getElementById("main_title_h2").innerHTML = "Alternative Fuel Stations Construction in the " + mouse_overed_state_full_name;
                document.getElementById("construction_h3").innerHTML = "Yearly construction for the " + mouse_overed_state_full_name;
                document.getElementById("policy_h3").innerHTML = "New Policy for the " + mouse_overed_state_full_name;

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
    getMapData("USA").then(() => {
            current_showing_data_name = "USA";
            current_showing_state_postal = "USA";
            drawMap();
            drawStations();
            document.getElementById("main_title_h2").innerHTML = "Alternative Fuel Stations Construction in the U.S.";
        document.getElementById("construction_h3").innerHTML = "Yearly construction for the U.S.";
        document.getElementById("policy_h3").innerHTML = "New Policy for the U.S.";

        }
    );
}

d3.csv('data/cng_only.csv').then((data) => {
    loadData(data, 'cng');
});

d3.csv('data/lng_only.csv').then((data) => {
    loadData(data, 'lng');
});

d3.csv('data/lpg_only.csv').then((data) => {
    loadData(data, 'lpg');
});

d3.csv('data/e85_only.csv').then((data) => {
    loadData(data, 'e85');
});

d3.csv('data/elec_only.csv').then((data) => {
    loadData(data, 'elec');
});

d3.csv('data/bd_only.csv').then((data) => {
    loadData(data, 'bd');
});

d3.csv('data/hy_only.csv').then((data) => {
    loadData(data, 'hy');
});

d3.csv('data/laws.csv').then((data)=>{
    loadData_law(data);
})

init();

$(document).ready(function () {
    //colors from the seaborn tab10 color pallette

    document.getElementById('cng_label').style.background = colors['cng'];
    document.getElementById('lng_label').style.background = colors['lng'];
    document.getElementById('lpg_label').style.background = colors['lpg'];
    document.getElementById('e85_label').style.background = colors['e85'];
    document.getElementById('bd_label').style.background = colors['bd'];
    document.getElementById('elec_label').style.background = colors['elec'];
    document.getElementById('hy_label').style.background = colors['hy'];
    document.getElementById('time-control-slider').addEventListener('slider', (event) => {
        visibleRange = [event.detail[0], event.detail[1]];
        drawStations();
    });

    $(document).on('change', 'input[class="fuel_type"]', function () {
        //svg_time_slider.selectAll('line').remove();
        svg_time_slider.selectAll('.lineChartLine').remove();
        svg_law_linear_graph.selectAll('.lineChartLine').remove();
        // svg_time_slider.selectAll("#xTicks_minor_slider").remove();

        $('input:checkbox').each(function () {
            if($(this)[0].id === "cng"
                || $(this)[0].id === "lng"
                || $(this)[0].id === "lpg"
                || $(this)[0].id === "e85"
                || $(this)[0].id === "bd"
                || $(this)[0].id === "elec"
                || $(this)[0].id === "hy"
            ){
                selectedFuelTypes[$(this).val()] = $(this).is(':checked');

            }
        });
        drawStations();
        draw_bar_chart();
    });
});
