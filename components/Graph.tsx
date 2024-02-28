import React, {useEffect, useRef, useState} from 'react';
import * as d3 from 'd3';
import dayjs from 'dayjs';
import {Button} from '@/components/ui/button';
import {saveSvgAsPng} from 'save-svg-as-png';
import {z} from "zod";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";

interface GraphProps {
    headers: string[];
    data: any[];
    graphOptions: GraphOptionsObject; // Adjust the type accordingly
    onBackPressed: () => void;
}

const formSchema = z.object({
    sorting: z.string().min(1),
});

const Graph: React.FC<GraphProps> = ({headers, data, graphOptions, onBackPressed}) => {
        const form = useForm<z.infer<typeof formSchema>>({
            resolver: zodResolver(formSchema),
            defaultValues: {
                sorting: "0"
            }
        });

        const svgRef = useRef<SVGSVGElement>(null);

        const [binsCount, setBinsCount] = useState<number>(10);
        const [barSorting, setBarSorting] = useState("0");

        //Graph dimensions
        const width = graphOptions.graphType === 'multiline' ? 1200 : 900;
        const marginRight = graphOptions.graphType === 'multiline' ? 300 : 20;
        const height = 700;
        const marginTop = 20;
        const marginBottom = 150;
        const marginLeft = 50;


        const xValues = data.map((item) => item[graphOptions.x]);
        const yValues = graphOptions.y.flatMap((key: string) => Object.values(data).map((obj) => obj[key]));

        const newKey = 'timeParsed';

        let x: any = undefined;
        let bins: any = undefined;
        let y: any = undefined;
        let xSet: Set<any>;


        if (graphOptions.graphType === "histogram") {
            bins = d3
                .bin()
                .thresholds(binsCount)
                .value((d: any) => d[graphOptions.x])(data);

            x = d3
                .scaleLinear()
                .domain([bins[0].x0, bins[bins.length - 1].x1])
                .range([marginLeft, width - marginRight]);

            y = d3
                .scaleLinear()
                .domain([0, d3.max(bins, (d: any) => d.length)])
                .range([height - marginBottom, marginTop]);

        } else if (graphOptions.graphType === "multiline" || graphOptions.graphType === "line") {
            const dateFormatMultiline = detectDateFormat(data[0][graphOptions.x]);
            data.forEach((item: any) => {
                item[newKey] = d3.timeParse(dateFormatMultiline)(item[graphOptions.x]);
            });
            graphOptions.x = newKey;
            x = d3
                .scaleUtc()
                .domain([data[0][graphOptions.x], data[data.length - 1][graphOptions.x]])
                .rangeRound([marginLeft, width - marginRight]);

        } else if (graphOptions.graphType === "bar") {
            x = d3.scaleBand().domain(xValues).range([marginLeft, width - marginRight]);

        } else if (graphOptions.graphType === "box-plot") {
            xSet = new Set(data.map((item) => item[graphOptions.x]));
            x = d3.scaleBand().domain(xSet).range([marginLeft, width - marginRight]);
        }

        y = graphOptions.graphType === 'histogram' ? y : (
            d3.scaleLinear()
                .domain(d3.extent(yValues))
                .range([height - marginBottom, marginTop])
        );


        useEffect(() => {
            const xAxis = d3.axisBottom(x).tickSizeOuter(0);
            const svg = d3
                .select(svgRef.current)
                .attr('width', width)
                .attr('height', height)
                .attr('viewBox', [0, 0, width, height])
                .attr('style', 'max-width: 100%; height: auto;');

            const renderHistogram = () => {
                svg
                    .append('g')
                    .attr('fill', 'steelblue')
                    .selectAll()
                    .data(bins)
                    .join('rect')
                    .attr('x', (d) => x(d.x0) + 1)
                    .attr('width', (d) => x(d.x1) - x(d.x0) - 1)
                    .attr('y', (d) => y(d.length))
                    .attr('height', (d) => y(0) - y(d.length));
            };

            const renderBar = () => {
                return svg
                    .append('g')
                    .attr('fill', 'steelblue')
                    .selectAll()
                    .data(data)
                    .join('rect')
                    .attr('x', (d) => x(d[graphOptions.x]))
                    .attr('y', (d) => y(d[graphOptions.y]))
                    .attr('height', (d) => y(Math.min(...yValues)) - y(d[graphOptions.y]))
                    .attr('width', x.bandwidth);
            };

            const renderLine = () => {
                svg
                    .append('path')
                    .datum(data)
                    .attr('fill', 'none')
                    .attr('stroke', 'steelblue')
                    .attr('stroke-width', 1.5)
                    .attr('d', d3.line().x((d) => x(d[graphOptions.x])).y((d) => y(d[graphOptions.y])));
            };

            const renderMultiline = () => {
                const colors = d3.schemeCategory10;
                for (let i = 0; i < graphOptions.y.length; i++) {
                    svg
                        .append('path')
                        .datum(data)
                        .attr('fill', 'none')
                        .attr('stroke', colors[i])
                        .attr('stroke-width', 1.5)
                        .attr('d', d3.line().x((d) => x(d[graphOptions.x])).y((d) => y(d[graphOptions.y[i]])));
                    svg
                        .append('circle')
                        .attr('cx', width - marginRight + 10)
                        .attr('cy', marginTop + marginTop - i * 15)
                        .attr('r', 6)
                        .style('fill', colors[i]);
                    svg
                        .append('text')
                        .attr('x', width - marginRight + 20)
                        .attr('y', marginTop + marginTop - 16 + i * 15)
                        .text(graphOptions.y[i])
                        .style('font-size', '13px')
                        .attr('alignment-baseline', 'middle');
                }
            };

            const renderBoxPlot = () => {
                let count = 0;
                xSet.forEach((set, index) => {
                    const iObjects = data.filter((item) => item[graphOptions.x] === set);
                    const iValues = iObjects.map((item) => item[graphOptions.y]);
                    const data_sorted = iValues.sort(d3.ascending);
                    const q1 = d3.quantile(data_sorted, 0.25);
                    const median = d3.quantile(data_sorted, 0.5);
                    const q3 = d3.quantile(data_sorted, 0.75);
                    const interQuantileRange = q3 - q1;
                    const min = q1 - 1.5 * interQuantileRange;
                    const max = q1 + 1.5 * interQuantileRange;
                    const bandWidth = x.bandwidth();
                    const xCoordinate = x(set) + bandWidth / 2;

                    svg
                        .append('line')
                        .attr('x1', xCoordinate)
                        .attr('x2', xCoordinate)
                        .attr('y1', y(min))
                        .attr('y2', y(max))
                        .attr('stroke', 'black');

                    svg
                        .append('rect')
                        .attr('x', xCoordinate - 50)
                        .attr('y', y(q3))
                        .attr('height', y(q1) - y(q3))
                        .attr('width', 100)
                        .attr('stroke', 'black')
                        .style('fill', '#69b3a2');

                    svg
                        .selectAll('toto')
                        .data([median])
                        .enter()
                        .append('line')
                        .attr('x1', xCoordinate - 50)
                        .attr('x2', xCoordinate + 50)
                        .attr('y1', function (d) {
                            return y(d);
                        })
                        .attr('y2', function (d) {
                            return y(d);
                        })
                        .attr('stroke', 'black');

                    svg
                        .selectAll('toto')
                        .data([min, max])
                        .enter()
                        .append('line')
                        .attr('x1', xCoordinate - 20)
                        .attr('x2', xCoordinate + 20)
                        .attr('y1', function (d) {
                            return y(d);
                        })
                        .attr('y2', function (d) {
                            return y(d);
                        })
                        .attr('stroke', 'black');
                    count++;
                });
            };

            // Call the appropriate function based on graph type
            let bar;
            switch (graphOptions.graphType) {
                case 'histogram':
                    renderHistogram();
                    break;
                case 'bar':
                    renderBar();
                    bar = renderBar()
                    break;
                case 'line':
                    renderLine();
                    break;
                case 'multiline':
                    renderMultiline();
                    break;
                case 'box-plot':
                    renderBoxPlot();
                    break;
                default:
                    break;
            }

            const gx = svg.append('g').attr('transform', `translate(0,${height - marginBottom})`).call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0));
            const gy = svg.append('g').attr('transform', `translate(${marginLeft},0)`);

            if (graphOptions.graphType === 'bar') {
                gx.selectAll('text')
                    .style('text-anchor', 'end')
                    .attr('dx', '-.8em')
                    .attr('dy', '.15em')
                    .attr('transform', 'rotate(-65)')
                    .attr('fill', 'currentColor')
                    .style('font-size', '13px');
            } else {
                gx.call((g) =>
                    g
                        .append('text')
                        .attr('x', width - marginRight)
                        .attr('y', marginBottom - 110)
                        .attr('fill', 'currentColor')
                        .style('font-size', '13px')
                        .attr('text-anchor', 'end')
                        .text(graphOptions.x)
                );
            }

            if (graphOptions.graphType === 'histogram') {
                gy.call(d3.axisLeft(y).ticks(height / 40))
                    .call((g) => g.select('.domain').remove())
                    .call((g) =>
                        g
                            .append('text')
                            .attr('x', -marginLeft)
                            .attr('y', 10)
                            .attr('fill', 'currentColor')
                            .style('font-size', '13px')
                            .attr('text-anchor', 'start')
                            .text('Frequency (' + graphOptions.x + ')')
                    );
            } else {
                gy.call(d3.axisLeft(y).ticks(height / 40))
                    .call((g) => g.select('.domain').remove())
                    .call((g) =>
                        g
                            .selectAll('.tick line')
                            .clone()
                            .attr('x2', width - marginLeft - marginRight)
                            .attr('stroke-opacity', 0.1)
                    )
                    .call((g) =>
                        g
                            .append('text')
                            .attr('x', -marginLeft)
                            .attr('y', 10)
                            .attr('fill', 'currentColor')
                            .style('font-size', '13px')
                            .attr('text-anchor', 'start')
                            .text(graphOptions.y)
                    );
            }

            if (graphOptions.graphType === 'bar') {
                switch (barSorting) {
                    case '0':
                        x.domain(data.sort((a, b) => a[graphOptions.x].localeCompare(b[graphOptions.x])).map((d) => d[graphOptions.x]));
                        break;
                    case '1':
                        x.domain(data.sort((a, b) => b[graphOptions.x].localeCompare(a[graphOptions.x])).map((d) => d[graphOptions.x]));
                        break;
                    case '2':
                        x.domain(data.sort((a, b) => a[graphOptions.y[0]] - b[graphOptions.y[0]]).map((d) => d[graphOptions.x]));
                        break;
                    case '3':
                        x.domain(data.sort((a, b) => b[graphOptions.y[0]] - a[graphOptions.y[0]]).map((d) => d[graphOptions.x]));
                        break;
                }

                const t = svg.transition().duration(750);

                bar.data(data, (d) => d[graphOptions.x])
                    .order()
                    .transition(t)
                    .delay((d, i) => i * 20)
                    .attr('x', (d) => x(d[graphOptions.x]));

                gx.transition(t).call(xAxis).selectAll('.tick').delay((d, i) => i * 20);
            }

            return () => {
                svg.selectAll('*').remove();
            };
        }, [data, binsCount, barSorting]);


        const onBack = () => {
            onBackPressed();
        };

        const onDownload = () => {
            if (!svgRef.current) return;

            const clonedSvg = svgRef.current.cloneNode(true) as SVGSVGElement;
            clonedSvg.setAttribute('style', 'background-color: white');
            saveSvgAsPng(clonedSvg, 'graph.png');
        };

        const BarForm: React.FC = () => {
            const handleChange = (value: any) => {
                setBarSorting(value)
            };

            return (
                <>
                    <Form {...form}>
                        <form className="w-2/3 space-y-6 mt-5 text-gray-700">
                            <FormField
                                control={form.control}
                                name="sorting"
                                render={({field}) => (
                                    <FormItem className="max-w-[400px]">
                                        <FormLabel className="text-sm">Sorting</FormLabel>
                                        <Select onValueChange={(e) => {
                                            handleChange(e);
                                            return field.onChange(e);
                                        }} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="border-gray-700">
                                                    <SelectValue placeholder="Select graph type"/>
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-gray-200 text-gray-700 text-2xl">
                                                <SelectItem key="0" value="0"> Default</SelectItem>
                                                <SelectItem key="1" value="1">Alphabetical</SelectItem>
                                                <SelectItem key="2" value="2">Frequency, ascending</SelectItem>
                                                <SelectItem key="3" value="3">Frequency, descending</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>

                                        </FormDescription>
                                        <FormMessage/>
                                    </FormItem>
                                )}/>
                        </form>
                    </Form></>
            );
        };

        return (
            <>
                <Button
                    type="button"
                    onClick={onBack}
                    className="bg-transparent mb-5 text-xl text-gray-700 hover:bg-gray-200 border-2 border-gray-700 hover:text-gray-700 mr-2"
                >
                    Back
                </Button>
                <Button
                    type="button"
                    onClick={onDownload}
                    className="bg-transparent mb-5 text-xl text-gray-700 hover:bg-gray-200 border-2 border-gray-700 hover:text-gray-700 mr-2"
                >
                    Download
                </Button>

                {graphOptions.graphType === 'bar' && <BarForm/>}

                <svg ref={svgRef} width="1920" height="1080">
                    {/* Add appropriate width and height */}
                </svg>
            </>
        );
    }
;

export default Graph;

function detectDateFormat(dateString: string): string {
    const formats: string[] = [
        '%Y-%m-%d %H:%M:%S.%L',
        '%Y-%m-%d %H:%M:%S',
        'YYYY-MM-DDTHH:mm',
        '%Y-%m-%d',
        'YYYY-MM-DD',
        'MM-DD-YYYY',
        'DD-MM-YYYY',
    ];

    for (let format of formats) {
        if (dayjs(dateString, format).isValid()) {
            return format;
        }
    }

    return '';
}
