import React, {useEffect, useRef} from 'react';
import * as d3 from 'd3';
import dayjs from "dayjs";

interface GraphProps {
    headers: string[];
    data: any;
    graphOptions: GraphOptionsObject;
}

const Graph: React.FC<GraphProps> = ({headers, data, graphOptions}) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const width = 1000;
    const height = 500;
    const marginTop = 20;
    const marginRight = 0;
    const marginBottom = 70;
    const marginLeft = 40;

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

    const possibleDateFormats = [

        // Add more formats here as needed
    ];

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


    // const parseDate = (timestamp: string) => {
    //     let parsedDate;
    //     for (let format of possibleDateFormats) {
    //         const parser = d3.timeParse(format);
    //         parsedDate = parser(timestamp);
    //         if (parsedDate !== null) {
    //             return parsedDate;
    //         }
    //     }
    //     throw new Error('Unable to parse timestamp');
    // };

    const dynamicDateFormat = (format: string) => d3.timeParse(format);
    const newKey = 'timeParsed';

    let x: any = undefined
    switch (graphOptions.xDataType) {
        case "string":
            x = d3.scaleBand()
                .domain(xValues)
                .range([marginLeft, width - marginRight])
                .padding(0.1);
            break;
        case "number":
            //TODO: scale ako je X number
            break;
        case "timestamp":
            const dateFormat = detectDateFormat(data[0][graphOptions.x])

            data.forEach((item: any) => {
                // Concatenate the dynamic part with some string
                item[newKey] = d3.timeParse(dateFormat)(item[graphOptions.x])
                console.log(item[newKey])
            });
            graphOptions.x = newKey

            console.log(data)
            // x = d3
            //     .scaleTime()
            //     .domain([parseDate(xValues[0]), parseDate(xValues[xValues.length - 1])])
            //     .range([marginLeft, width - marginRight]); // Adjust range as needed
            x = d3.scaleUtc()
                // .domain(d3.extent(data, d => d[graphOptions.x]))
                .domain([data[0][graphOptions.x], data[data.length - 1][graphOptions.x]])
                .rangeRound([marginLeft, width - marginRight]);
            break;


    }

    let y: any = undefined
    y = d3
        .scaleLinear()
        .domain([Math.min(...yValues), Math.max(...yValues)])
        .range([height - marginBottom, marginTop]); // Adjust range according to your SVG dimensions
    // switch (graphOptions.yDataType) {
    //     case "string":
    //         // TODO: implementiraj kad je y string
    //         break;
    //     case "number":
    //         y = d3
    //             .scaleLinear()
    //             .domain([Math.min(...yValues), Math.max(...yValues)])
    //             .range([height - marginBottom, marginTop]); // Adjust range according to your SVG dimensions
    //         break;
    // }


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
                // const line = d3.line()
                //     .x(d => x(d[graphOptions.x]))
                //     .y(d => y(d[graphOptions.y]));
                // svg.append("path")
                //     .attr("fill", "none")
                //     .attr("stroke", "steelblue")
                //     .attr("stroke-width", 1.5)
                //     .attr("d", line(data));

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
        }


        // Create the axes.
        //TODO: vrijednosti prevelike na x-u

        // const gx = svg.append('g')
        //     .attr('transform', `translate(0,${height - marginBottom})`)
        //     .call(d3.axisBottom(x).tickSizeOuter(0))

        const gx = svg.append("g")
            .attr("transform", `translate(0,${height - marginBottom})`)
            .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0));

        if (graphOptions.graphType === "bar") {
            gx.selectAll("text")
                .style("text-anchor", "end")
                .attr("dx", "-.8em")
                .attr("dy", ".15em")
                .attr("transform", "rotate(-65)");
        }

        // const gy = svg
        //     .append('g')
        //     .attr('transform', `translate(${marginLeft},0)`)
        //     .call(d3.axisLeft(y).tickFormat((y) => (y * 100).toFixed()))
        //     .call((g) => g.select('.domain').remove())
        //     .call(g => g.append("text")
        //         .attr("x", -marginLeft)
        //         .attr("y", 10)
        //         .attr("fill", "currentColor")
        //         .attr("text-anchor", "start")
        //         .text(graphOptions.y)
        //     )

        const gy = svg.append("g")
            .attr("transform", `translate(${marginLeft},0)`)
            .call(d3.axisLeft(y).ticks(height / 40))
            .call(g => g.select(".domain").remove())
            .call(g => g.selectAll(".tick line").clone()
                .attr("x2", width - marginLeft - marginRight)
                .attr("stroke-opacity", 0.1))
            .call(g => g.append("text")
                .attr("x", -marginLeft)
                .attr("y", 10)
                .attr("fill", "currentColor")
                .attr("text-anchor", "start")
                .text(graphOptions.y));

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

    }, [data]);

    return (
        <svg ref={svgRef} width="1920" height="1080">
            {/* Add appropriate width and height */}
        </svg>
    );
};

export default Graph;
