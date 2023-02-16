let dictionary_presenting_data = {};

let pop_up_width = 100;
let pop_up_height = 100;

let pop_up_x = 0;
let pop_up_y = 0;

let line_height = 20;
let line_max_length = 0;

let showing_text_list = [];
let showing_text_amount = 0;

svg_map.on('mousemove', function (e) {
    pop_up_x = e.offsetX + 10;
    pop_up_y = e.offsetY;
})

svg_bar_chart.on('mousemove', function (e) {
    pop_up_x = e.offsetX + 10;
    pop_up_y = e.offsetY;
})

function pop_up_display(showing_state, overed = "map", target_svg = svg_map) {
    let g_pop_up = target_svg
        .append('g')
        .attr('id', 'g_pop_up')

    if (showing_state) {
        showing_text_list = [];
        let counting = 0;
        if (current_showing_data_name === "USA" || overed === "bar") {
            showing_text_list.push({type: "name", value: mouse_overed_state_full_name});
            key_list.forEach((fuel_type) => {
                counting = 0;
                if (data_bar_chart_dict[fuel_type][mouse_overed_state_postal] !== undefined) {
                    counting = data_bar_chart_dict[fuel_type][mouse_overed_state_postal];
                }
                showing_text_list.push({type: fuel_type, value: fuel_type + ": " + counting});

            })
            counting = 0;
            if(total_count_dict[mouse_overed_state_postal]!==undefined){
                counting = total_count_dict[mouse_overed_state_postal];
            }
            showing_text_list.push({type: 'total', value: 'total' + ": " + counting});
        } else {
            showing_text_list.push({type: "name", value: mouse_overed_station["Station Name"]});
            showing_text_list.push({type: "address", value: mouse_overed_station["Street Address"]});
            showing_text_list.push({type: "phone", value: mouse_overed_station["Station Phone"]});
            showing_text_list.push({
                type: mouse_overed_station["Fuel Type Code"],
                value: "Open Date: " + mouse_overed_station["Open Date"].toString().slice(
                    0, mouse_overed_station["Open Date"].toString().length - 43
                )
            });
            console.log(mouse_overed_station["Open Date"]);
        }

        line_max_length = 0;
        showing_text_list.forEach((text) => {
            let text_length = text_pixel_length(text.value);
            if (text_length > line_max_length) {
                line_max_length = text_length;
            }
        })
        showing_text_amount = showing_text_list.length;

        if (pop_up_x + line_max_length + 25 > width) {
            pop_up_x -= (line_max_length + 25 + 30);
        }
        if (pop_up_y + showing_text_amount * (line_height + 5) + 5 > height) {
            pop_up_y -= showing_text_amount * (line_height + 5) + 5;
        }

        g_pop_up.append('rect')
            .attr('id', 'pop_up_window')
            .attr('x', pop_up_x)
            .attr('y', pop_up_y)
            .attr('width', line_max_length + 25)
            .attr('height', showing_text_amount * (line_height + 2) + 5)
            .attr('stroke', 'black')
            .attr('fill', '#EEFFFF')

        g_pop_up.selectAll('#pop_up_text')
            .data(showing_text_list)
            .enter()
            .append('text')
            .attr('id', 'pop_up_text')
            .attr('x', pop_up_x + 5)
            .attr('y', (d, i) => {
                if (d.type !== "name") {
                    return pop_up_y + i * line_height + 20;
                }
                return pop_up_y + i * line_height + 15;
            })
            .text((d) => {
                return d.value;
            })
            .style('fill', (d) => {
                if (colors[d.type] !== undefined) {
                    return colors[d.type];
                }
                return 'black';
            })
            .style("font-weight", (d) => {
                if (d.type === "name") {
                    return 700;
                } else {
                    return 500;
                }
            })

        // if(current_showing_data_name === "USA"){
        //
        // }else{
        //     svg_map.select('#pop_up_window').remove();
        //     svg_map.selectAll('#pop_up_text').remove();
        // }


    } else {
        target_svg.select('#pop_up_window').remove();
        target_svg.selectAll('#pop_up_text').remove();
    }
}

function text_pixel_length(text)//from "https://bloodguy.tistory.com/entry/JavaScript-%EB%AC%B8%EC%9E%90%EC%97%B4-%EA%B8%B8%EC%9D%B4%EB%A5%BC-%ED%94%BD%EC%85%80%EB%A1%9C-%EA%B0%80%EC%A0%B8%EC%98%A4%EA%B8%B0-get-text-length-in-pixel"
{
    let myId = 'ruler_for_text';

    let ruler = document.getElementById(myId);

    if (!ruler) {
        ruler = document.createElement('span');
        ruler.id = myId;
        ruler.setAttribute('style', 'visibility:hidden; white-space:nowrap; position:absolute; left:-9999px; top: -9999px;');
        document.body.appendChild(ruler);
    }

    ruler.style.font = document.body.style.font;

    ruler.innerText = text;

    return ruler.offsetWidth;
}