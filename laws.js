(function() {
    let width = document.body.clientWidth*3/4;
    let height = 600;
    let margin = 30;

    let margin_law = {top: 30, bottom: 40, left: 30, right: 10}
    let svg = d3.select('#laws-viz').append('svg')
        .attr('width', width)
        .attr('height', height)
        // .attr("transform", "translate(" + margin_law.left + "," + margin_law.top + ")")

    ;

    let colors = {
        'cng': "#1f77b4",
        'lng': "#ff7f0e",
        'lpg': "#2ca02c",
        'e85': "#d62728",
        'bd': "#9467bd",
        'elec': "#8c564b",
        'hy': "#e377c2",
    };

    let lawsData = {
        'cng': {},
        'lng': {},
        'lpg': {},
        'e85': {},
        'bd': {},
        'elec': {},
        'hy': {},
    };

    let max = 0;

    d3.csv('data/laws.csv').then((data) => {

        data.forEach((d) => {
            d['year'] = +d['Enacted Date'].substring(0, 4);
            if(d['year']>=1995) {
                if (d['Technology Categories'].includes('cng')) {
                    d['color'] = colors['cng'];
                    if (!(d['year'] in lawsData['cng']))
                        lawsData['cng'][d['year']] = 1;
                    else
                        lawsData['cng'][d['year']]++;
                }

                if (d['Technology Categories'].includes('lpg')) {
                    d['color'] = colors['lpg'];
                    if (!(d['year'] in lawsData['lpg']))
                        lawsData['lpg'][d['year']] = 1;
                    else lawsData['lpg'][d['year']]++;
                }

                if (d['Technology Categories'].includes('e85')) {
                    d['color'] = colors['e85'];
                    if (!(d['year'] in lawsData['e85']))
                        lawsData['e85'][d['year']] = 1;
                    else lawsData['e85'][d['year']]++;
                }

                if (d['Technology Categories'].includes('bd')) {
                    d['color'] = colors['bd'];
                    if (!(d['year'] in lawsData['bd']))
                        lawsData['bd'][d['year']] = 1;
                    else lawsData['bd'][d['year']]++;
                }

                if (d['Technology Categories'].includes('elec')) {
                    d['color'] = colors['elec'];
                    if (!(d['year'] in lawsData['elec']))
                        lawsData['elec'][d['year']] = 1;
                    else lawsData['elec'][d['year']]++;
                }

                if (d['Technology Categories'].includes('hy')) {
                    d['color'] = colors['hy'];
                    if (!(d['year'] in lawsData['hy']))
                        lawsData['hy'][d['year']] = 1;
                    else lawsData['hy'][d['year']]++;
                }
            }
        });
        console.log(lawsData);
        max=84;
        return null;
    }).then(() => {
        // Generate scales
        let xScale = d3.scaleLinear()
            .domain([1995,2022])
            .range([0, width - margin_law.left - margin_law.right]);

        let yScale = d3.scaleLinear()
            .domain([0, 100])
            .range([height - margin_law.top - margin_law.bottom, 0]);

        // Axes
        let g = svg.append("g")
            // .attr("transform", "translate(" + margin + "," + 0 + ")");

        g.append("g")
            .attr("transform", "translate("+margin_law.left+"," +margin_law.top + ")")
            .call(d3.axisBottom(xScale).tickFormat(d3.format("d")));

        g.append("g")
            .attr("transform", "translate(" + margin + "," + margin_law.top+ ")")
            .call(d3.axisLeft(yScale));



        // For highlighting line
        //
        // Keep a list of lines
        // On mouseover decrease opacity of all lines, set opacity of current line to 100%
        //          and set variable isMouseOnLine to true
        // On mouseout, set isMouseOnLine to false use setTimeout for 200 ms. Once 200ms is up:
        //     Check if isMouseOnLine is true. If so, do nothing. Else set all opacities to 100%





        // // Line
        g.append("path")
            .datum(Object.keys(lawsData['cng']))
            .attr("fill", "none")
            .attr("opacity",0.4)
            .attr("class","cng_line")
            .attr("stroke", colors['cng'])
            .attr("stroke-width", 4)
            .attr("d", d3.line()
                .x((d) => xScale(parseInt(d)))
                .y((d) => {
                    let result = 0;
                    if(yScale(lawsData['cng'][d])!==undefined){
                        result = lawsData['cng'][d];
                    }
                    return yScale(result);
                }))
            .attr("transform", "translate(" + margin + "," + margin_law.top+ ")")
            .on("mouseenter", function () {
                svg.selectAll(".cng_line").style("opacity", 1);
            })
            .on("mouseleave", function () {
                svg.selectAll(".cng_line").style("opacity", 0.4);
            });

        g.append("path")
            .datum(Object.keys(lawsData['elec']))
            .attr("fill", "none")
            .attr("class","elec_line")
            .attr("stroke", colors['elec'])
            .attr("stroke-width", 4)
            .attr("opacity",0.4)
            .attr("d", d3.line()
                .x((d) => xScale(d))
                .y((d) => {
                    let result = 0;
                    if(yScale(lawsData['elec'][d])!==undefined){
                        result = lawsData['elec'][d];
                    }
                    return yScale(result);
                }))
            .attr("transform", "translate(" + margin + "," + margin_law.top+ ")")
            .on("mouseenter", function () {
                svg.selectAll(".elec_line").style("opacity", 1);
            })
            .on("mouseleave", function () {
                svg.selectAll(".elec_line").style("opacity", 0.4);
            });

        g.append("path")
            .datum(Object.keys(lawsData['bd']))
            .attr("fill", "none")
            .attr("class","bd_line")
            .attr("stroke", colors['bd'])
            .attr("stroke-width", 4)
            .attr("opacity",0.4)
            .attr("d", d3.line()
                .x((d) => xScale(d))
                .y((d) => {
                    let result = 0;
                    if(yScale(lawsData['bd'][d])!==undefined){
                        result = lawsData['bd'][d];
                    }
                    return yScale(result);
                }))
            .attr("transform", "translate(" + margin + "," + margin_law.top+ ")")
            .on("mouseenter", function () {
                svg.selectAll(".bd_line").style("opacity", 1);
            })
            .on("mouseleave", function () {
                svg.selectAll(".bd_line").style("opacity", 0.4);
            });

        g.append("path")
            .datum(Object.keys(lawsData['hy']))
            .attr("fill", "none")
            .attr("class","hy_line")
            .attr("stroke", colors['hy'])
            .attr("stroke-width", 4)
            .attr("opacity",0.4)
            .attr("d", d3.line()
                .x((d) => xScale(d))
                .y((d) => {
                    let result = 0;
                    if(yScale(lawsData['hy'][d])!==undefined){
                        result = lawsData['hy'][d];
                    }
                    return yScale(result);
                }))
            .attr("transform", "translate(" + margin + "," + margin_law.top+ ")")
            .on("mouseenter", function () {
                svg.selectAll(".hy_line").style("opacity", 1);
            })
            .on("mouseleave", function () {
                svg.selectAll(".hy_line").style("opacity", 0.4);
            });

        g.append("path")
            .datum(Object.keys(lawsData['lpg']))
            .attr("fill", "none")
            .attr("class","lpg_line")
            .attr("stroke", colors['lpg'])
            .attr("stroke-width", 4)
            .attr("opacity",0.4)
            .attr("d", d3.line()
                .x((d) => xScale(d))
                .y((d) => {
                    let result = 0;
                    if(yScale(lawsData['lpg'][d])!==undefined){
                        result = lawsData['lpg'][d];
                    }
                    return yScale(result);
                }))
            .attr("transform", "translate(" + margin + "," + margin_law.top+ ")")
            .on("mouseenter", function () {
                svg.selectAll(".lpg_line").style("opacity", 1);
            })
            .on("mouseleave", function () {
                svg.selectAll(".lpg_line").style("opacity", 0.4);
            });

        g.append("path")
            .datum(Object.keys(lawsData['e85']))
            .attr("fill", "none")
            .attr("class","e85_line")
            .attr("opacity",0.4)
            .attr("stroke", colors['e85'])
            .attr("stroke-width", 4)
            .attr("d", d3.line()
                .x((d) => xScale(d))
                .y((d) => {
                    let result = 0;
                    if(yScale(lawsData['e85'][d])!==undefined){
                        result = lawsData['e85'][d];
                    }
                    return yScale(result);
                }))
            .attr("transform", "translate(" + margin + "," + margin_law.top+ ")")
            .on("mouseenter", function () {
                svg.selectAll(".e85_line").style("opacity", 1);
            })
            .on("mouseleave", function () {
                svg.selectAll(".e85_line").style("opacity", 0.4);
            });

        // // Axis labels
        // chart.append("text")
        //     .attr("class", "axis-label")
        //     .attr("x", width / 2 + 1.5 * margin)
        //     .attr("y", height + 0.9 * margin)
        //     .text("Year");

        // chart.append("text")
        //     .attr("class", "axis-label")
        //     .attr("writing-mode", "vertical-rl")
        //     .attr("transform", "rotate(180)")
        //     .attr("x", -1 * margin * 0.75)
        //     .attr("y", -1 * (height / 2 + 0.5 * margin))
        //     .text("Tweet count");

        // // Data point mouseover circle
        // // I referred to https://d3-graph-gallery.com/graph/line_cursor.html
        // // and https://bl.ocks.org/d3noob/755172c605313b94e5c72bc66066a87e to
        // // create this
        // let bisect = d3.bisector((d) => d.year).left;

        // let focusCircleRadius = 6;
        // let focusCircle = chart.append("g")
        //     .append('circle')
        //     .style("fill", "#4280DB")
        //     .attr('r', focusCircleRadius)
        //     .style("opacity", 0)

        // let focusTextBgWidth = 130;
        // let focusTextBg = chart.append("rect")
        //     .style("fill", "#ffffff")
        //     .style("stroke", "#111111")
        //     .style("stroke-width", 3)
        //     .style("opacity", 0)
        //     .attr("width", focusTextBgWidth)
        //     .attr("height", 55)
        //     .attr("x", width / 2 + margin)
        //     .attr("y", height / 2 - margin)
        //     .attr("rx", 10);

        // let focusTextYear = chart.append("g")
        //     .append("text")
        //     .style("fill", "#4280DB")
        //     .style("opacity", 0)
        //     .attr("text-anchor", "left")
        //     .attr("alignment-baseline", "middle");

        // let focusTextTweets = chart.append("g")
        //     .append("text")
        //     .style("fill", "#4280DB")
        //     .style("opacity", 0)
        //     .style("font-weight", "bold")
        //     .attr("text-anchor", "left")
        //     .attr("alignment-baseline", "middle");

        // let focusBoxTransitionDuration = 200;

        // function mouseover() {
        //     // Don't animate moving focus box the first time
        //     let temp = focusBoxTransitionDuration;
        //     focusBoxTransitionDuration = 0;
        //     mousemove();
        //     focusBoxTransitionDuration = temp;

        //     focusCircle.style("opacity", 1);
        //     focusTextYear.style("opacity", 1);
        //     focusTextTweets.style("opacity", 1);
        //     focusTextBg.style("opacity", 1);
        // }

        // function mousemove() {
        //     let x0 = xScale.invert(d3.pointer(event, this)[0] - margin / 2);
        //     let i = bisect(data, x0, 1);

        //     if (i > data.length)
        //         i = data.length;

        //     selectedData = data[i - 1];

        //     focusCircle
        //         .transition().ease(d3.easeLinear).duration(focusBoxTransitionDuration)
        //         .attr("cx", xScale(selectedData.year) + margin)
        //         .attr("cy", yScale(selectedData.tweets));
        //     focusTextBg
        //         .transition().ease(d3.easeLinear).duration(focusBoxTransitionDuration)
        //         .attr("x", xScale(selectedData.year) + margin - focusTextBgWidth / 2 + 4)
        //         .attr("y", yScale(selectedData.tweets) + 12);
        //     focusTextYear
        //         .html("Year: " + (new Date(selectedData.year).getYear() + 1900))
        //         .transition().ease(d3.easeLinear).duration(focusBoxTransitionDuration)
        //         .attr("x", xScale(selectedData.year) + margin - 17 - focusTextBgWidth / 4)
        //         .attr("y", yScale(selectedData.tweets) + 30);
        //     focusTextTweets
        //         .html("Tweets: " + selectedData.tweets)
        //         .transition().ease(d3.easeLinear).duration(focusBoxTransitionDuration)
        //         .attr("x", xScale(selectedData.year) + margin - 17 - focusTextBgWidth / 4)
        //         .attr("y", yScale(selectedData.tweets) + 52);
        // }

        // function mouseout() {
        //     focusCircle.style("opacity", 0);
        //     focusTextYear.style("opacity", 0);
        //     focusTextTweets.style("opacity", 0);
        //     focusTextBg.style("opacity", 0);
        // }

        // chart.append("rect")
        //     .style("fill", "none")
        //     .style("pointer-events", "all")
        //     .attr("x", margin)
        //     .attr("y", 0)
        //     .attr("width", width)
        //     .attr("height", height)
        //     .on("mouseover", mouseover)
        //     .on("mousemove", mousemove)
        //     .on("mouseout", mouseout);
    });
})();