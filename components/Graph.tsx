import React, {useEffect, useRef, useState} from 'react';
import * as d3 from 'd3';
import {Button} from '@/components/ui/button';
import {saveSvgAsPng} from 'save-svg-as-png';
import {z} from "zod";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import Statistics from "@/components/Statistics";
import {detectDateFormat} from '@/utils/dateUtils'

interface GraphProps {
    headers: string[];
    data: any[];
    graphOptions: GraphOptionsObject; // Adjust the type accordingly
    onBackPressed: () => void;
}


const formSchema = z.object({
    sorting: z.string().min(1),
    binSize: z.coerce.number().min(1).max(100),
});

const Graph: React.FC<GraphProps> = ({headers, data, graphOptions, onBackPressed}) => {
        const form = useForm<z.infer<typeof formSchema>>({
            resolver: zodResolver(formSchema),
            defaultValues: {
                sorting: "0",
                binSize: 10,
            }
        });

        const svgRef = useRef<SVGSVGElement>(null);

        const [binSize, setBinSize] = useState<number>(10);
        const [boxPlotStatistics, setBoxPlotStatistics] = useState<StatisticItem[]>([]);

        //Graph dimensions
        const [width, marginRight, height, marginTop, marginBottom, marginLeft] = calculateGraphDimensions(graphOptions, headers, data);

        const xValues = data.map((item) => item[graphOptions.x]);

        const yValues = graphOptions.y.flatMap((key: string) => Object.values(data).map((obj) => obj[key]));
        const newKey = 'timeParsed';
        useEffect(() => {
            let x: any = undefined;
            let bins: any = undefined;
            let y: any = undefined;
            let xSet: Set<any>;
            let min: number;
            let max: number;
            const dataCopy = [...data];
            [min, max] = d3.extent(yValues)

            if (graphOptions.graphType === "histogram") {
                bins = d3
                    .bin()
                    .thresholds(binSize)
                    .value((d: any) => d[graphOptions.x])(data);

                x = d3
                    .scaleLinear()
                    .domain([bins[0].x0, bins[bins.length - 1].x1])
                    .range([marginLeft, width - marginRight]);


                y = d3
                    .scaleLinear()
                    // @ts-ignore
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
                x = d3.scaleBand();
                switch (graphOptions.sorting) {
                    case '0':
                        x.domain(xValues);
                        break;
                    case '1':
                        x.domain(dataCopy.sort((a, b) => a[graphOptions.x].localeCompare(b[graphOptions.x])).map((d) => d[graphOptions.x]));
                        break;
                    case '2':
                        x.domain(dataCopy.sort((a, b) => b[graphOptions.x].localeCompare(a[graphOptions.x])).map((d) => d[graphOptions.x]));
                        break;
                    case '3':
                        x.domain(dataCopy.sort((a, b) => a[graphOptions.y[0]] - b[graphOptions.y[0]]).map((d) => d[graphOptions.x]));
                        break;
                    case '4':
                        x.domain(dataCopy.sort((a, b) => b[graphOptions.y[0]] - a[graphOptions.y[0]]).map((d) => d[graphOptions.x]));
                        break;
                }
                x.range([marginLeft, width - marginRight])

            } else if (graphOptions.graphType === "box-plot") {
                xSet = new Set(data.map((item) => item[graphOptions.x]));
                x = d3.scaleBand().domain(xSet).range([marginLeft, width - marginRight]);
                xSet.forEach((set, index) => {
                    const iObjects = data.filter((item) => item[graphOptions.x] === set);
                    const iValues = iObjects.map((item) => item[graphOptions.y]);
                    const data_sorted = iValues.sort(d3.ascending);
                    const q1 = d3.quantile(data_sorted, 0.25);
                    const q3 = d3.quantile(data_sorted, 0.75);
                    const interQuantileRange = q3 - q1;
                    const minWhisker = q1 - 1.5 * interQuantileRange;
                    const maxWhisker = q3 + 1.5 * interQuantileRange;

                    if (min > minWhisker) {
                        min = minWhisker - Math.abs(minWhisker * 0.1)
                    }
                    if (max < maxWhisker) {
                        max = maxWhisker
                    }
                });
            }
            y = graphOptions.graphType === 'histogram' ? y : (
                d3.scaleLinear()
                    .domain([min, max])
                    .range([height - marginBottom, marginTop])
            );

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
                    .data(dataCopy)
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
                const maxTextWidth = 100;
                let lastHeight = marginTop + marginTop;

                for (let i = 0; i < graphOptions.y.length; i++) {
                    const yValue = graphOptions.y[i];
                    const yData = data.map(d => d[yValue]);
                    const exceedMaxWidth = getTextWidth(yValue, '13px') > maxTextWidth;

                    svg.append('path')
                        .datum(data)
                        .attr('fill', 'none')
                        .attr('stroke', colors[i])
                        .attr('stroke-width', 1.5)
                        .attr('d', d3.line().x(d => x(d[graphOptions.x])).y((d, idx) => y(yData[idx])));

                    svg.append('circle')
                        .attr('cx', width - marginRight + 10)
                        .attr('cy', lastHeight)
                        .attr('r', 6)
                        .style('fill', colors[i]);

                    if (exceedMaxWidth) {
                        let line = '';
                        let lineNumber = 0;
                        const lineHeight = 15;
                        const xCoord = width - marginRight + 20;
                        const words = yValue.split(/\s+/);

                        words.forEach(word => {
                            const testLine = line + (line === '' ? '' : ' ') + word;
                            const testWidth = getTextWidth(testLine, '13px');
                            if (testWidth > maxTextWidth) {
                                svg.append('text')
                                    .attr('x', xCoord)
                                    .attr('y', lastHeight + lineNumber * lineHeight)
                                    .text(line)
                                    .style('font-size', '13px')
                                    .attr('alignment-baseline', 'middle');
                                line = word;
                                lineNumber++;
                            } else {
                                line = testLine;
                            }
                            lastHeight += lineNumber * lineHeight;
                        });

                        svg.append('text')
                            .attr('x', xCoord)
                            .attr('y', lastHeight)
                            .text(line)
                            .style('font-size', '13px')
                            .attr('alignment-baseline', 'middle');
                        lastHeight += lineHeight;
                    } else {
                        svg.append('text')
                            .attr('x', width - marginRight + 20)
                            .attr('y', lastHeight)
                            .text(yValue)
                            .style('font-size', '13px')
                            .attr('alignment-baseline', 'middle');
                        lastHeight += 15;
                    }
                }
            };

            function getTextWidth(text, font) {
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                context.font = font;
                return context.measureText(text).width;
            }


            const renderBoxPlot = () => {
                let count = 0;
                let newBoxPlotStatistics: StatisticItem[] = [];
                xSet.forEach((set, index) => {
                    const iObjects = data.filter((item) => item[graphOptions.x] === set);
                    const iValues = iObjects.map((item) => item[graphOptions.y]);
                    const data_sorted = iValues.sort(d3.ascending);
                    const q1 = d3.quantile(data_sorted, 0.25);
                    const median = d3.quantile(data_sorted, 0.5);
                    const q3 = d3.quantile(data_sorted, 0.75);
                    const interQuantileRange = q3 - q1;
                    const minWhisker = q1 - 1.5 * interQuantileRange;
                    const maxWhisker = q3 + 1.5 * interQuantileRange;
                    const bandWidth = x.bandwidth();
                    const xCoordinate = x(set) + bandWidth / 2;
                    const mean = d3.mean(iValues);
                    const deviation = d3.deviation(iValues);

                    const boxPlotStatistic: StatisticItem = {
                        label: set,
                        median: median,
                        q1: q1,
                        q3: q3,
                        iqr: interQuantileRange,
                        minWhisker: minWhisker,
                        maxWhisker: maxWhisker,
                        min: Math.min(...iValues),
                        max: Math.max(...iValues),
                        mean: d3.mean(iValues),
                        deviation: deviation,
                        skew: (3 * (mean - median)) / deviation,
                        graphType: graphOptions.graphType + "-category",
                    }

                    newBoxPlotStatistics.push(boxPlotStatistic)

                    //line
                    svg
                        .append('line')
                        .attr('x1', xCoordinate)
                        .attr('x2', xCoordinate)
                        .attr('y1', y(minWhisker))
                        .attr('y2', y(maxWhisker))
                        .attr('stroke', 'black');
                    //rectangle
                    svg
                        .append('rect')
                        .attr('x', xCoordinate - 50)
                        .attr('y', y(q3))
                        .attr('height', y(q1) - y(q3))
                        .attr('width', 100)
                        .attr('stroke', 'black')
                        .style('fill', '#69b3a2');

                    //median line
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
                        .data([minWhisker, maxWhisker])
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
                setBoxPlotStatistics(newBoxPlotStatistics);
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


            //Rendering x and y axis
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
                        .attr('y', marginBottom - marginBottom + 40)
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
                            .attr('x', -marginLeft + 5)
                            .attr('y', 20)
                            .attr('fill', 'currentColor')
                            .style('font-size', '13px')
                            .attr('text-anchor', 'start')
                            .text('Frequency (' + graphOptions.x + ')')
                    );
            } else {

                if (graphOptions.graphType == "multiline") {
                    gy.call(d3.axisLeft(y).ticks(height / 40))
                        .call((g) => g.select('.domain').remove())
                        .call((g) =>
                            g
                                .selectAll('.tick line')
                                .clone()
                                .attr('x2', width - marginLeft - marginRight)
                                .attr('stroke-opacity', 0.1)
                        );
                    gx.call((g) =>
                        g
                            .append('text')
                            .attr('x', 0)
                            .attr('y', 30)
                            .attr('fill', 'currentColor')
                            .style('font-size', '13px')
                            .attr('text-anchor', 'start')
                            .text(graphOptions.y)
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
                        ).call((g) =>
                        g
                            .append('text')
                            .attr('x', 0)
                            .attr('y', 30)
                            .attr('fill', 'currentColor')
                            .style('font-size', '13px')
                            .attr('text-anchor', 'start')
                            .text(graphOptions.y)
                    );
                }

            }

            //Sorting of bar graph live (treba dodat switch)
            // if (graphOptions.graphType === 'bar') {
            //
            //
            //     const t = svg.transition().duration(750);
            //
            //     bar.data(data, (d) => d[graphOptions.x])
            //         .order()
            //         .transition(t)
            //         .delay((d, i) => i * 20)
            //         .attr('x', (d) => x(d[graphOptions.x]));
            //
            //     gx.transition(t).call(xAxis).selectAll('.tick').delay((d, i) => i * 20);
            // }

            return () => {
                svg.selectAll('*').remove();
            };
        }, [data, binSize]);


        const onBack = () => {
            onBackPressed();
        };

        const onDownload = () => {
            if (!svgRef.current) return;

            const clonedSvg = svgRef.current.cloneNode(true) as SVGSVGElement;
            clonedSvg.setAttribute('style', 'background-color: white');
            saveSvgAsPng(clonedSvg, 'graph.png');
        };

        const HistogramForm: React.FC = () => {
            const handleSubmit = (values: z.infer<typeof formSchema>) => {
                setBinSize(values.binSize)
            }
            return (

                <>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSubmit)} className="flex w-2/3 my-3 text-gray-700">
                            <FormField
                                control={form.control}
                                name="binSize"
                                render={({field}) => (
                                    <FormItem className="max-w-[100px]">
                                        <FormLabel className="text-sm">Bins</FormLabel>
                                        <Input className="border-gray-700" type="number" {...field} />
                                        <FormDescription>

                                        </FormDescription>
                                        <FormMessage/>
                                    </FormItem>
                                )}/>

                            <Button type="submit"
                                    className="ml-2 mt-8 bg-transparent text-sm text-gray-700 hover:bg-gray-300 border-2 border-gray-700 hover:text-gray-700"
                            >Submit</Button>
                        </form>
                    </Form></>);

        };

        return (
            <>
                <div>
                    <Button
                        type="button"
                        onClick={onBack}
                        className="bg-transparent text-xl text-gray-700 hover:bg-gray-200 border-2 border-gray-700 hover:text-gray-700 mr-2"
                    >
                        Back
                    </Button>
                    <Button
                        type="button"
                        onClick={onDownload}
                        className="text-gray-300 text-xl bg-gray-700 hover:bg-gray-200 border-2 border-gray-700 hover:text-gray-700 mr-2"
                    >
                        Download
                    </Button>
                </div>

                <div className="mt-5 flex">
                    <svg ref={svgRef} width="1920" height="1080"
                         className="mr-5 min-w-[800px] border-2 border-gray-700 relative rounded max-h-[1080px]">
                        <text x="50%" y="30" textAnchor="middle"
                              fill="currentColor">
                            {graphOptions.title}
                        </text>
                    </svg>
                    <div
                        className="pl-5 overflow-y-auto border-2 border-gray-700 relative rounded hidden lg:block lg:min-w-[230px] xl:min-w-[600px]">
                        <Statistics graphOptions={graphOptions} data={data} boxPlotStatistics={boxPlotStatistics}/>
                    </div>

                </div>

                <div>
                    {graphOptions.graphType === 'histogram' && <HistogramForm/>}
                </div>

                <div className="block lg:hidden border-2 border-gray-700 relative rounded px-2 py-2 my-2 max-h-[1080px]">
                    <Statistics graphOptions={graphOptions} data={data} boxPlotStatistics={boxPlotStatistics}/>
                </div>

            </>
        );
    }
;

export default Graph;

function calculateGraphDimensions(graphOptions: GraphOptionsObject, headers: string[], data: any[]): number[] {
    const width: number = graphOptions.graphType === "multiline" ? 1000 : 900;
    const marginRight: number = graphOptions.graphType === "multiline" ? 140 : 20;

    const height = 700;
    const marginTop = 60;
    const marginBottom = graphOptions.graphType === "bar" ? 150 : 50;
    const marginLeft = 50;

    return [width, marginRight, height, marginTop, marginBottom, marginLeft];
}
