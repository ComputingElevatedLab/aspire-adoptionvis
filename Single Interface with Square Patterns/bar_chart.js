let height_bar_chart = 700;
let width_bar_chart = document.body.clientWidth * 0.34;

let margin_barChart = {top: 20, bottom: 100, left: 30, right: 100};

let bar_height = 20;

let accumulating_check = false;
let showing_usa_check = true;

let selected_bar_chart_type = "";
let showing_bar_chart_type = "";


let svg_bar_chart = d3.select("#bar-chart")
    .append("svg")
    .attr("height", height_bar_chart - margin_barChart.bottom)
    .attr("width", width_bar_chart)

let svg_group_rects = svg_bar_chart.append('g').attr('id', 'bars_in_chart');

let xScale_bar_chart, xAxis_bar_chart;
let yScale_bar_chart, yAxis_bar_chart;

let showing_data_bar_chart = [];
let data_bar_chart_dict = {};

let total_count_dict = {};

let mouse_overed_state_on_bar = "";

let showing_state_list = [];

init_bar_chart();

function init_bar_chart() {

    draw_bar_chart();
}

function draw_bar_chart(){
    showing_data_bar_chart = [];
    data_bar_chart_dict = {};

    showing_state_list = [];

    let year_start = selected_time_range[0];
    if(accumulating_check){
        year_start = 1994;
    }
    let year_end = selected_time_range[1];

    let number_of_showing_fuel_type = 0;
    let iterator_of_showing_fuel_type = {};
    let max_value_bar_chart = 0;
    let data_per_key;

    key_list.forEach((target_fuel) => {//target fuel type
        data_per_key = allData_count[target_fuel];
        if (data_bar_chart_dict[target_fuel] === undefined) {
            data_bar_chart_dict[target_fuel] = {};
        }
        for (let i_year = year_start; i_year <= year_end; i_year++) {
            Object.keys(data_per_key[i_year]).forEach((target_state) => {
                if(!showing_usa_check && target_state==='USA')
                    return;
                if (data_bar_chart_dict[target_fuel][target_state] === undefined) {
                    data_bar_chart_dict[target_fuel][target_state] = 0;
                }
                data_bar_chart_dict[target_fuel][target_state] += data_per_key[i_year][target_state];
            })
        }
    });
    Object.keys(data_bar_chart_dict).forEach((target_fuel) => {
        iterator_of_showing_fuel_type[target_fuel] = number_of_showing_fuel_type;
        number_of_showing_fuel_type += 1;
        data_bar_chart_dict[target_fuel] = Object.entries(data_bar_chart_dict[target_fuel])//sorting
            .sort(([, a], [, b]) => b - a)
            .reduce((r, [k, v]) => ({...r, [k]: v}), {});
        Object.keys(data_bar_chart_dict[target_fuel]).forEach((target_state) => {
            if (max_value_bar_chart < data_bar_chart_dict[target_fuel][target_state]) {
                max_value_bar_chart = data_bar_chart_dict[target_fuel][target_state];
            }
            showing_state_list.push(target_state);
            showing_data_bar_chart.push({
                state: target_state,
                fuel: target_fuel,
                count: data_bar_chart_dict[target_fuel][target_state]
            });
        })
    })

    showing_state_list = showing_state_list.filter((val, idx) => {//Remove duplicated elements
        return showing_state_list.indexOf(val) === idx;
    });

    //state sorting by total number of selected fuel type stations
    total_count_dict = {};
    showing_state_list.filter((state)=>{
        total_count_dict[state] = 0;
    })
    Object.keys(data_bar_chart_dict).forEach((fuel_type)=>{
        Object.keys(data_bar_chart_dict[fuel_type]).forEach((state)=>{
            total_count_dict[state] += data_bar_chart_dict[fuel_type][state];
        })
    })
    showing_state_list = Object.keys(Object.entries(total_count_dict)//sorting
        .sort(([, a], [, b]) => b - a)
        .reduce((r, [k, v]) => ({...r, [k]: v}), {}));

    showing_state_list = showing_state_list.slice(0,28);

    yScale_bar_chart = d3.scaleBand()
        .domain(showing_state_list).range([0, showing_state_list.length * bar_height])
        .paddingOuter([0.2]).paddingInner([0.25]);
    yAxis_bar_chart = d3.axisLeft(yScale_bar_chart);

    xScale_bar_chart = d3.scaleLinear().domain([0, max_value_bar_chart]).range([0, width_bar_chart - margin_barChart.left - margin_barChart.right])
    xAxis_bar_chart = d3.axisTop(xScale_bar_chart).tickFormat(d3.format(".2s"))


    svg_group_rects.select(".yTicks").remove();
    svg_group_rects.select(".xTicks").remove();


    svg_group_rects.append("g")
        .attr("class", "yTicks")
        .call(yAxis_bar_chart)
        .attr("transform", "translate(" + (margin_barChart.left) + "," + margin_barChart.top + ")");

    svg_group_rects.append("g")
        .attr("class", "xTicks")
        .call(xAxis_bar_chart)
        .attr("transform", "translate(" + (margin_barChart.left) + "," + margin_barChart.top + ")");

    svg_group_rects.selectAll('#rect_in_chart')
        .data(showing_data_bar_chart)
        .join(
            function (enter) {
                return enter
                    .append('rect')
            }, function (update) {
                return update;
            }, function (exit) {
                return exit.remove();
            }
        )
        .attr('id', 'rect_in_chart')
        .attr('x', 0)
        .attr('y', (d) => {
            if(showing_state_list.includes(d.state)){
                return yScale_bar_chart(d.state) + iterator_of_showing_fuel_type[d.fuel] * (yScale_bar_chart.bandwidth()/number_of_showing_fuel_type);
            }
            return -9999;
        })
        .attr('height', yScale_bar_chart.bandwidth()/number_of_showing_fuel_type)
        .attr('width', (d)=>{
            return xScale_bar_chart(d.count);
        })
        .attr('fill', (d)=>{
            return colors[d.fuel];
        })
        .attr("transform", "translate(" + (margin_barChart.left) + "," + margin_barChart.top + ")")
        .on("mouseover",(e,d)=>{
            mouse_overed_state_on_bar = d.state;
            mouse_overed_state_full_name = d.state;
            mouse_overed_state_postal = d.state;

            pop_up_display(true,"bar",svg_bar_chart);
            drawMap();
        })
        .on("mouseout",()=>{
            mouse_overed_state_on_bar = "";
            pop_up_display(false,"bar",svg_bar_chart);
            drawMap();
        })
}

function drawStateHighlight(){
    if(showing_state_list.includes(mouse_overed_state_postal)){
        svg_bar_chart.append('rect')
            .attr('id','high_light_rect')
            .attr('x', 0)
            .attr('y', yScale_bar_chart(mouse_overed_state_postal) - 5)
            .attr('width', width_bar_chart + margin_barChart.left - margin_barChart.right)
            .attr('height', yScale_bar_chart.bandwidth() + 10)
            .attr("transform", "translate(" + 0 + "," + margin_barChart.top + ")")
            .attr("fill","none")
            // .attr("stroke", "#FFA07A")
            .attr("stroke", "#FF0000")
            .attr("stroke-width", 5)

    }else {
        svg_bar_chart.selectAll("#high_light_rect").remove();
    }
}

function accumulation_check(){
    accumulating_check = !accumulating_check;
    draw_bar_chart();
}

function usa_data_check(){
    showing_usa_check = !showing_usa_check;
    draw_bar_chart();
}

function chnage_accumulate_year(){
    document.getElementById("accumulating").textContent = "Accumulating to " + selected_time_range[1];
}