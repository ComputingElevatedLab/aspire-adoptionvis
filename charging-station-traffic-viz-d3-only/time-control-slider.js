let height_slider = 200;
let width_slider = document.body.clientWidth;
let temporal_ticks_height_slider = 30;

let temporal_minor_ticks_height = 5;

let margin_slider = {top: 10, bottom: 0, left: 30, right: 30}

let time_range_slider = [1994, 2022];//Have to link with dataSet
let selected_time_range = [2020, 2021];

let max_data = 0;
let max_data_law = 0;

let annual_check = true;
let low_check = false;

let svg_time_slider = d3.select("#time-control-slider")
    .append("svg")
    .attr("height", height_slider)
    .attr("width", width_slider)

let svg_law_linear_graph = d3.select("#law_linear_graph")
    .append("svg")
    .attr("height", height_slider)
    .attr("width", width_slider)

svg_time_slider.append("rect")//background for temporal chart in the time slider
    .attr("id", "slider-chart-background")
    .attr("height", height_slider - temporal_ticks_height_slider - margin_slider.top - margin_slider.bottom)
    .attr("width", width_slider - margin_slider.left - margin_slider.right)
    .attr("x", margin_slider.left)
    .attr("y", margin_slider.top)
    .attr("fill", "#E0E0E0")

svg_law_linear_graph.append("rect")//background for temporal chart in the time slider
    .attr("id", "slider-chart-background")
    .attr("height", height_slider - temporal_ticks_height_slider - margin_slider.top - margin_slider.bottom)
    .attr("width", width_slider - margin_slider.left - margin_slider.right)
    .attr("x", margin_slider.left)
    .attr("y", margin_slider.top)
    .attr("fill", "#E0E0E0")

let xScale_slider = d3.scaleLinear().domain(time_range_slider).range([margin_slider.left, width_slider - 2*margin_slider.left - margin_slider.right]);
let xAxis_slider = d3.axisBottom(xScale_slider).tickFormat(d3.format("d"));

let minor_ticks = minor_ticks_list(time_range_slider);
let tick_gap_slider = xScale_slider(2001) - xScale_slider(2000);

svg_time_slider.append("g")
    .attr("id", "xTicks_minor_slider")
    .selectAll("#xTicks_minor_slider")
    .data(minor_ticks)
    .enter()
    .append("line")
    .attr("stroke", "black")
    .attr("x1", (d) => {
        return xScale_slider(d)
    })
    .attr("y1", 0)
    .attr("x2", (d) => {
        return xScale_slider(d)
    })
    .attr("y2", temporal_minor_ticks_height)
    .attr("transform", "translate(" + margin_slider.left + "," + (height_slider - temporal_ticks_height_slider - margin_slider.bottom) + ")")

svg_law_linear_graph.append("g")
    .attr("id", "xTicks_minor_slider")
    .selectAll("#xTicks_minor_slider")
    .data(minor_ticks)
    .enter()
    .append("line")
    .attr("stroke", "black")
    .attr("x1", (d) => {
        return xScale_slider(d);
    })
    .attr("y1", 0)
    .attr("x2", (d) => {
        return xScale_slider(d)
    })
    .attr("y2", temporal_minor_ticks_height)
    .attr("transform", "translate(" + margin_slider.left + "," + (height_slider - temporal_ticks_height_slider - margin_slider.bottom) + ")")


svg_time_slider.append("g")
    .attr("id", "xTicks_slider")
    .attr("transform", "translate(" + margin_slider.left + "," + (height_slider - temporal_ticks_height_slider - margin_slider.bottom) + ")")
    .call(xAxis_slider);
svg_law_linear_graph.append("g")
    .attr("id", "xTicks_slider")
    .attr("transform", "translate(" + margin_slider.left + "," + (height_slider - temporal_ticks_height_slider - margin_slider.bottom) + ")")
    .call(xAxis_slider);

// ---------- Time Range Select Box ----------
svg_time_slider.append("rect")
    .attr("id", "time-range-rect")
    .attr("fill", "red")
    .attr("stroke", "black")
    .attr("opacity", 0.2)
    .attr("x", () => {
        return xScale_slider(selected_time_range[0]) - tick_gap_slider / 2;
    })
    .attr("y", margin_slider.top)
    .attr("height", height_slider - temporal_ticks_height_slider - margin_slider.top - margin_slider.bottom)
    .attr("width", () => {
        return xScale_slider(selected_time_range[1]) - xScale_slider(selected_time_range[0]);
    })
    .attr("transform", "translate(" + margin_slider.left + "," + 0 + ")")
    .call(d3.drag().on("start", (event) => {
        let range_rect = d3.select("#time-range-rect");
        let range_shift_rect = d3.select("#time-range-shift-rect");
        if (event.x < xScale_slider(selected_time_range[0]) + tick_gap_slider / 2) {
            event.on("drag", dragged_left).on("end", ended_left);
        } else {
            event.on("drag", dragged_right).on("end", ended_right);
        }


        function dragged_left(event) {
            range_rect
                .attr("x", event.x)
                .attr("width", xScale_slider(selected_time_range[1] - 1) - event.x + tick_gap_slider / 2)
            range_shift_rect
                .attr("x", parseFloat(event.x) + parseFloat(range_rect.attr('width')) / 2 - margin_slider.top)
        }

        function dragged_right(event) {
            range_rect
                .attr("width", event.x - xScale_slider(selected_time_range[0]))
            range_shift_rect
                .attr("x", parseFloat(range_rect.attr("x")) + parseFloat(range_rect.attr('width')) / 2 - margin_slider.top)
        }

        function ended_left(event) {
            selected_time_range[0] = Math.ceil(xScale_slider.invert(event.x));

            if (selected_time_range[0] === selected_time_range[1]) {
                selected_time_range[1] += 1;
            } else if (selected_time_range[0] > selected_time_range[1]) {
                let temp = selected_time_range[0];
                selected_time_range[0] = selected_time_range[1];
                selected_time_range[1] = temp;
            }

            range_rect
                .attr("x", () => {
                    return xScale_slider(selected_time_range[0]) - tick_gap_slider / 2;
                })
                .attr("width", () => {
                    return xScale_slider(selected_time_range[1]) - xScale_slider(selected_time_range[0]);
                })
            range_shift_rect
                .attr("x", xScale_slider(selected_time_range[0] - 1) + (xScale_slider(selected_time_range[1]) - xScale_slider(selected_time_range[0] - 1)) / 2 - margin_slider.top)


            let slider_event = new CustomEvent('slider', {bubbles: true, detail: selected_time_range});
            svg_time_slider.node().dispatchEvent(slider_event);
        }

        function ended_right(event) {
            selected_time_range[1] = Math.round(xScale_slider.invert(event.x)) - 1;

            if (selected_time_range[0] === selected_time_range[1]) {
                selected_time_range[1] += 1;
            } else if (selected_time_range[0] > selected_time_range[1]) {
                let temp = selected_time_range[0];
                selected_time_range[0] = selected_time_range[1];
                selected_time_range[1] = temp;
            }

            range_rect
                .attr("x", () => {
                    return xScale_slider(selected_time_range[0]) - tick_gap_slider / 2;
                })
                .attr("width", () => {
                    return xScale_slider(selected_time_range[1] + 1) - xScale_slider(selected_time_range[0]);
                })
            range_shift_rect
                .attr("x", xScale_slider(selected_time_range[0]) + (xScale_slider(selected_time_range[1]) - xScale_slider(selected_time_range[0])) / 2 - margin_slider.top)

            let slider_event = new CustomEvent('slider', {bubbles: true, detail: selected_time_range});
            svg_time_slider.node().dispatchEvent(slider_event);
        }
    }));

// ---------- Moving Box for Time Range Select Box ----------
svg_time_slider.append("rect")
    .attr("id", "time-range-shift-rect")
    .attr("fill", "#FFFFFF")
    .attr("stroke", "black")
    .attr("x", () => {
        let range_rect = d3.select("#time-range-rect");

        return parseFloat(range_rect.attr('x')) + parseFloat(range_rect.attr('width')) / 2 - margin_slider.top;
    })
    .attr("y", margin_slider.top / 2)
    .attr("height", margin_slider.top)
    .attr("width", 2 * margin_slider.top)
    .attr("transform", "translate(" + margin_slider.left + "," + 0 + ")")
    .call(d3.drag().on("start", (event) => {
        let range_rect = d3.select("#time-range-rect");
        let range_shift_rect = d3.select("#time-range-shift-rect");

        event.on("drag", dragged).on("end", ended);

        function dragged(event) {
            range_rect
                .attr("x", event.x - parseFloat(range_rect.attr("width")) / 2)
            range_shift_rect
                .attr("x", event.x - margin_slider.top)
        }

        function ended() {
            selected_time_range[0] = Math.ceil(xScale_slider.invert(range_rect.attr('x')));
            selected_time_range[1] = Math.round(xScale_slider.invert(parseFloat(range_rect.attr('x')) + parseFloat(range_rect.attr('width'))));

            range_rect
                .attr("x", () => {
                    return xScale_slider(selected_time_range[0]) - tick_gap_slider / 2;
                })
                .attr("width", () => {
                    return xScale_slider(selected_time_range[1] + 1) - xScale_slider(selected_time_range[0]);
                })
            range_shift_rect
                .attr("x", xScale_slider(selected_time_range[0]) + (xScale_slider(selected_time_range[1]) - xScale_slider(selected_time_range[0])) / 2 - margin_slider.top)

            let slider_event = new CustomEvent('slider', {bubbles: true, detail: selected_time_range});
            svg_time_slider.node().dispatchEvent(slider_event);
        }
    }));


// --------------- chart in slide bar -------------
function linearChart(stationData, type, target, color, target_svg) {//Draw the new Charge Station per year line chart

    // const year_list = Object.keys(stationData);
    //
    // for (let i_year = 0; i_year < year_list.length; i_year++){
    //     if(max_data<stationData[year_list[i_year]]){
    //         max_data = stationData[year_list[i_year]]
    //     }
    // }
    //function for 16000 -> 20000
    let max_y = Math.ceil(1.1 * max_data / (Math.pow(10, max_data.toString().length - 1))) * Math.pow(10, max_data.toString().length - 1)

    max_data_law = 0;
    Object.keys(selectedFuelTypes).forEach((keys, i) => {
        if (selectedFuelTypes[keys]) {
            const year_list = Object.keys(law_data[keys]);

            for (let i_year = 0; i_year < year_list.length; i_year++) {
                if (max_data_law < law_data[keys][year_list[i_year]][current_showing_state_postal]) {
                    max_data_law = law_data[keys][year_list[i_year]][current_showing_state_postal];
                }
            }
        }
    })

    let max_y_law = Math.ceil(1.1 * max_data_law / (Math.pow(10, max_data_law.toString().length - 1))) * Math.pow(10, max_data_law.toString().length - 1)


    let yScale_slider = d3.scaleLinear().domain([0, max_y]).range([height_slider - temporal_ticks_height_slider - margin_slider.top - margin_slider.bottom, 0])
    let yAxis_slider = d3.axisLeft(yScale_slider).tickFormat(d3.format(".2s"));

    let yScale_slider_law = d3.scaleLinear().domain([0, max_y_law]).range([height_slider - temporal_ticks_height_slider - margin_slider.top - margin_slider.bottom, 0])
    let yAxis_slider_law = d3.axisLeft(yScale_slider_law).tickFormat(d3.format(".2s"));

    svg_time_slider.select("#yTicks_slider").remove();
    svg_law_linear_graph.select("#yTicks_slider_law").remove();
    svg_time_slider.select("#xTicks_slider").remove();
    svg_time_slider.select("#xTicks_minor_slider").remove();
    svg_law_linear_graph.select("#xTicks_slider").remove();
    svg_law_linear_graph.select("#xTicks_minor_slider").remove();

    svg_time_slider.append("g")
        .attr("id", "yTicks_slider")
        .attr("transform", "translate(" + margin_slider.left + "," + (margin_slider.top) + ")")
        .call(yAxis_slider)

    svg_law_linear_graph.append("g")
        .attr("id", "yTicks_slider_law")
        .attr("transform", "translate(" + margin_slider.left + "," + (margin_slider.top) + ")")
        .call(yAxis_slider_law)

    svg_time_slider.append("g")
        .attr("id", "xTicks_slider")
        .attr("transform", "translate(" + margin_slider.left + "," + (height_slider - temporal_ticks_height_slider - margin_slider.bottom) + ")")
        .call(xAxis_slider);

    svg_law_linear_graph.append("g")
        .attr("id", "xTicks_slider")
        .attr("transform", "translate(" + margin_slider.left + "," + (height_slider - temporal_ticks_height_slider - margin_slider.bottom) + ")")
        .call(xAxis_slider);

    svg_time_slider.append("g")
        .attr("id", "xTicks_minor_slider")
        .selectAll("#xTicks_minor_slider")
        .data(minor_ticks)
        .enter()
        .append("line")
        .attr("stroke", "black")
        .attr("x1", (d) => {
            return xScale_slider(d);
        })
        .attr("y1", 0)
        .attr("x2", (d) => {
            return xScale_slider(d)
        })
        .attr("y2", temporal_minor_ticks_height)
        .attr("transform", "translate(" + margin_slider.left + "," + (height_slider - temporal_ticks_height_slider - margin_slider.bottom) + ")")

    svg_law_linear_graph.append("g")
        .attr("id", "xTicks_minor_slider")
        .selectAll("#xTicks_minor_slider")
        .data(minor_ticks)
        .enter()
        .append("line")
        .attr("stroke", "black")
        .attr("x1", (d) => {
            return xScale_slider(d);
        })
        .attr("y1", 0)
        .attr("x2", (d) => {
            return xScale_slider(d)
        })
        .attr("y2", temporal_minor_ticks_height)
        .attr("transform", "translate(" + margin_slider.left + "," + (height_slider - temporal_ticks_height_slider - margin_slider.bottom) + ")")


    let line_path = d3.line()
        .x((d) => {
            return xScale_slider(parseInt(d)) + tick_gap_slider / 2;
        })
        .y((d) => {
            let result = 0;
            if (yScale_slider(stationData[d] !== undefined)) {
                if (yScale_slider(stationData[d][target]) !== undefined) {
                    result = stationData[d][target];
                }
            }
            return yScale_slider(result);
        })

    let line_path_law = d3.line()
        .x((d) => {
            return xScale_slider(parseInt(d)) + tick_gap_slider / 2;
        })
        .y((d) => {
            let result = 0;
            if (law_data[type][parseInt(d)] !== undefined) {
                if (law_data[type][parseInt(d)][target] !== undefined) {
                    result = law_data[type][parseInt(d)][target];
                }
            }
            return yScale_slider_law(result);
        })

    svg_time_slider.select('#' + type).remove();
    svg_time_slider.append('g')
        .attr('id', 'linearChart_slider')
        .append('path')
        .datum(Object.keys(stationData))
        .attr('d', line_path)
        .attr('class', 'lineChartLine')
        .attr('id', type)
        .attr('stroke', color)
        .attr('stroke-width', 3)
        .attr('opacity', 0.8)
        .attr('fill', 'none')
        .on("mouseenter", function () {
            d3.select(this).attr('stroke-width', 8)
        })
        .on("mouseleave", function () {
            d3.select(this).attr('stroke-width', 3)
        });

    svg_law_linear_graph.select('#law_' + type).remove();
    svg_law_linear_graph.append('g')
        .attr('id', 'linearChart_slider')
        .append('path')
        .datum(Object.keys(stationData))
        .attr('d', line_path_law)
        .attr('class', 'lineChartLine')
        .attr('id', 'law_'+type)
        .attr('stroke', color)
        .attr('stroke-width', 3)
        .attr('opacity', 0.8)
        .attr('fill', 'none')
        .on("mouseenter", function () {
            d3.select(this).attr('stroke-width', 8)
        })
        .on("mouseleave", function () {
            d3.select(this).attr('stroke-width', 3)
        });
}

// --------------- functions --------------
function minor_ticks_list(range) {
    let current = range[0];
    let result = [current];
    while (true) {
        current += 1;
        result.push(current);
        if (current === range[1]) {
            break;
        }
    }
    return result;
}