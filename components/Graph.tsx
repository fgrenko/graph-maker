import React, {useEffect, useRef, useState} from 'react';
import * as d3 from 'd3';
import dayjs from "dayjs";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Slider} from "@/components/ui/slider";

interface GraphProps {
    headers: string[];
    data: any;
    graphOptions: GraphOptionsObject;
    onBackPressed: () => void;
}

const Graph: React.FC<GraphProps> = ({headers, data, graphOptions, onBackPressed}) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [binsCount, setBinsCount] = useState<number>(10);

    const width = graphOptions.graphType === "multiline" ? 1200 : 900
    const marginRight = graphOptions.graphType === "multiline" ? 300 : 20
    const height = 700;
    const marginTop = 20;
    const marginBottom = 150;
    const marginLeft = 40;


    // rewrite this
    let indexNaN = new Set<number>();

    const xValues = data.map((item: any, index: number) => {
        return item[graphOptions.x];
    });
    const yValues = data.map((item: any, index: number) => {
        const value = item[graphOptions.y];
        if (isNaN(value)) {
            indexNaN.add(index);
        }
        return value;
    });

    indexNaN.forEach((index) => {
        data.splice(index, 1);
        xValues.splice(index, 1);
        yValues.splice(index, 1);
    });

    function detectDateFormat(dateString: string) {
        const formats = [
            '%Y-%m-%d %H:%M:%S.%L',
            '%Y-%m-%d %H:%M:%S',
            "YYYY-MM-DDTHH:mm",
            '%Y-%m-%d',
            "YYYY-MM-DD",        // Date format: 2024-02-23
            "MM-DD-YYYY",        // Date format: 02-23-2024
            "DD-MM-YYYY", // Timestamp format: 2024-02-23T12:00
            // Add more formats as needed
        ];

        for (let format of formats) {
            if (dayjs(dateString, format).isValid()) {
                return format;
            }
        }

        return ""; // If no format matches
    }

    const newKey = 'timeParsed';

    let x: any = undefined
    let bins: any = undefined
    let y: any = undefined

    if (graphOptions.graphType === "histogram") {
        bins = d3.bin()
            .thresholds(binsCount) // Use the state variable for the number of bins
            .value((d) => d[graphOptions.x])
            (data);

        x = d3.scaleLinear()
            .domain([bins[0].x0, bins[bins.length - 1].x1])
            .range([marginLeft, width - marginRight]);

        y = d3.scaleLinear()
            .domain([0, d3.max(bins, (d) => d.length)])
            .range([height - marginBottom, marginTop]);

    } else if (graphOptions.graphType === "multiline") {
        const dateFormat = detectDateFormat(data[0][graphOptions.x])
        data.forEach((item: any) => {
            item[newKey] = d3.timeParse(dateFormat)(item[graphOptions.x])
        });
        graphOptions.x = newKey
        x = d3.scaleUtc()
            .domain([data[0][graphOptions.x], data[data.length - 1][graphOptions.x]])
            .rangeRound([marginLeft, width - marginRight]);

        const allYValues = graphOptions.y.flatMap(key => Object.values(data).map(obj => obj[key]));

        const [minValue, maxValue] = d3.extent(allYValues)

        y = d3
            .scaleLinear()
            .domain([minValue, maxValue])
            .range([height - marginBottom, marginTop]);


    } else {
        switch (graphOptions.xDataType) {
            case "string":
                x = d3.scaleBand()
                    .domain(xValues)
                    .range([marginLeft, width - marginRight]);
                break;
            case "number":
                x = d3.scaleLinear()
                    .domain([Math.min(...xValues), Math.max(...xValues)])
                    .range([marginLeft, width - marginRight]);
                break;
            case "timestamp":
                const dateFormat = detectDateFormat(data[0][graphOptions.x])
                data.forEach((item: any) => {
                    item[newKey] = d3.timeParse(dateFormat)(item[graphOptions.x])
                });
                graphOptions.x = newKey
                x = d3.scaleUtc()
                    .domain([data[0][graphOptions.x], data[data.length - 1][graphOptions.x]])
                    .rangeRound([marginLeft, width - marginRight]);
                break;
        }
        y = d3
            .scaleLinear()
            .domain([Math.min(...yValues), Math.max(...yValues)])
            .range([height - marginBottom, marginTop]);
    }

    // TODO: moze li y biti string?
    useEffect(() => {
        //TODO: add validation for NaN when X is a number
        const xAxis = d3.axisBottom(x).tickSizeOuter(0);

        const svg = d3
            .select(svgRef.current)
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [0, 0, width, height])
            .attr("style", "max-width: 100%; height: auto;");

        //TODO: izvuci bar varijablu van switcha
        switch (graphOptions.graphType) {
            case "histogram":
                svg.append("g")
                    .attr("fill", "steelblue")
                    .selectAll()
                    .data(bins)
                    .join("rect")
                    .attr("x", (d) => x(d.x0) + 1)
                    .attr("width", (d) => x(d.x1) - x(d.x0) - 1)
                    .attr("y", (d) => y(d.length))
                    .attr("height", (d) => y(0) - y(d.length));
                break;
            case "bar":
                const bar = svg
                    .append('g')
                    .attr('fill', 'steelblue')
                    .selectAll()
                    .data(data)
                    .join('rect')
                    .attr('x', (d: any) => x(d[graphOptions.x])) // Use graphOptions.x to access the corresponding property from data
                    .attr('y', (d: any) => y(d[graphOptions.y])) // Use graphOptions.y to access the corresponding property from data
                    .attr('height', (d: any) => y(Math.min(...yValues)) - y(d[graphOptions.y])) // Compute height based on y
                    .attr('width', x.bandwidth);
                break;
            case "line":
                svg.append("path")
                    .datum(data)
                    .attr("fill", "none")
                    .attr("stroke", "steelblue")
                    .attr("stroke-width", 1.5)
                    .attr("d", d3.line()
                        .x(function (d) {
                            return x(d[graphOptions.x])
                        })
                        .y(function (d) {
                            return y(d[graphOptions.y])
                        })
                    )

                break;
            case "multiline":
                const colors = d3.schemeCategory10

                for (let i = 0; i < graphOptions.y.length; i++) {
                    svg.append("path")
                        .datum(data)
                        .attr("fill", "none")
                        .attr("stroke", colors[i])
                        .attr("stroke-width", 1.5)
                        .attr("d", d3.line()
                            .x(function (d) {
                                return x(d[graphOptions.x])
                            })
                            .y(function (d) {
                                return y(d[graphOptions.y[i]])
                            })
                        );

                    svg.append("circle").attr("cx", width - marginRight + 10).attr("cy", marginTop + marginTop - (i * 15)).attr("r", 6).style("fill", colors[i])
                    svg.append("text").attr("x", width - marginRight + 20).attr("y", marginTop + marginTop - 16 + (i * 15)).text(graphOptions.y[i]).style("font-size", "13px").attr("alignment-baseline", "middle")
                }

                break;
        }


        // Create the axes.
        //TODO: vrijednosti prevelike na x-u
        const gx = svg.append("g")
            .attr("transform", `translate(0,${height - marginBottom})`)
            .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0))

        const gy = svg.append("g")
            .attr("transform", `translate(${marginLeft},0)`);

        if (graphOptions.graphType === "bar") {
            gx.selectAll("text")
                .style("text-anchor", "end")
                .attr("dx", "-.8em")
                .attr("dy", ".15em")
                .attr("transform", "rotate(-65)")
                .attr("fill", "currentColor")
                .style("font-size", "13px")
        } else {
            gx.call((g) => g.append("text")
                .attr("x", width - marginRight)
                .attr("y", marginBottom - 110)
                .attr("fill", "currentColor")
                .style("font-size", "13px")
                .attr("text-anchor", "end")
                .text(graphOptions.x));
        }


        if (graphOptions.graphType === "histogram") {
            gy.call(d3.axisLeft(y).ticks(height / 40))
                .call((g) => g.select(".domain").remove())
                .call((g) => g.append("text")
                    .attr("x", -marginLeft)
                    .attr("y", 10)
                    .attr("fill", "currentColor")
                    .style("font-size", "13px")
                    .attr("text-anchor", "start")
                    .text("Frequency (" + graphOptions.x + ")"));
        } else {
            gy.call(d3.axisLeft(y).ticks(height / 40))
                .call(g => g.select(".domain").remove())
                .call(g => g.selectAll(".tick line").clone()
                    .attr("x2", width - marginLeft - marginRight)
                    .attr("stroke-opacity", 0.1))
                .call(g => g.append("text")
                    .attr("x", -marginLeft)
                    .attr("y", 10)
                    .attr("fill", "currentColor")
                    .style("font-size", "13px")
                    .attr("text-anchor", "start")
                    .text(graphOptions.y));
        }


        // TODO: dodaj sortiranja kod bar grafova
        // const updateChart = (order) => {
        //     x.domain(data.sort(order).map(d => d.letter));
        //
        //     const t = svg.transition()
        //         .duration(750);
        //
        //     bar.data(data, d => d.letter)
        //         .order()
        //         .transition(t)
        //         .delay((d, i) => i * 20)
        //         .attr("x", d => x(d.letter));
        //
        //     gx.transition(t)
        //         .call(xAxis)
        //         .selectAll(".tick")
        //         .delay((d, i) => i * 20);
        // }

        return () => {
            svg.selectAll("*").remove();
        };

    }, [data, binsCount]);

    const onBack = () => {
        onBackPressed()
    }

    // function handleGraphOptions() = {
    //
    // }


    return (
        <>
            <Button
                type="button"
                onClick={onBack}
                className="bg-transparent mb-5 text-xl text-gray-700 hover:bg-gray-200 border-2 border-gray-700 hover:text-gray-700 mr-2">
                Back
            </Button>
            {/*TODO: add slider for histagram*/}
            {/*<div className="mt-3">*/}
            {/*    <p>*/}
            {/*        <label>Bins</label>*/}
            {/*        <Slider*/}
            {/*            defaultValue={[10]}*/}
            {/*            min={1}*/}
            {/*            max={data.length}*/}
            {/*            onChange={(e) => console.log(e)}*/}
            {/*        />*/}
            {/*    </p>*/}
            {/*</div>*/}
            <svg ref={svgRef} width="1920" height="1080">
                {/* Add appropriate width and height */}
            </svg>
        </>
    );
};

export default Graph;
