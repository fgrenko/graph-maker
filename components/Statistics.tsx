import React from 'react';
import * as d3 from "d3";
import StatisticItem from "@/components/StatisticItem";

interface StatisticsProps {
    graphOptions: GraphOptionsObject;
    data: any[];
    boxPlotStatistics: StatisticItem[];
}

const Statistics: React.FC<StatisticsProps> = ({graphOptions, data, boxPlotStatistics}) => {

        const allValues = graphOptions.graphType === "histogram" ? [graphOptions.x] : [...graphOptions.y]; // Corrected to an array
        const statisticsObject = allValues.map((option, key) => {
            const values = data.map((item) => item[option]);
            const mean = d3.mean(values) as number;
            const median = d3.median(values) as number; // Ensuring the return type as number
            const deviation = d3.deviation(values) as number; // Ensuring the return type as number
            const skew = (3 * (mean - median)) / deviation;
            const [min, max] = d3.extent(values) as [number, number]; // Ensuring the return type as [number, number]

            const object: StatisticItem = {
                label: option,
                mean: mean,
                median: median,
                deviation: deviation,
                skew: skew,
                min: min,
                max: max,
                graphType: graphOptions.graphType,
            };
            return object;
        });

        return (
            <>
                <h2 className="text-2xl">Statistics:</h2>
                {statisticsObject.map((object, index) => {
                    if (graphOptions.graphType === 'box-plot') {
                        return (
                            <div key={index}> {/* Added key prop for better performance */}
                                <StatisticItem object={object} index={index}/>
                                {object.graphType === "box-plot" ?
                                    <h3 className={'text-xl underline'}>Categories:</h3> : null}
                                <div className="flex flex-wrap">
                                    {boxPlotStatistics.map((bpObject, bpIndex) => ( // Changed index to bpIndex to avoid conflict
                                        <StatisticItem key={bpIndex} object={bpObject} index={bpIndex}/> // Added key prop for better performance
                                    ))}
                                </div>
                            </div>
                        );
                    } else {
                        return <StatisticItem key={index} object={object} index={index}/>; // Added key prop for better performance
                    }
                })}
            </>
        );
    }
;

export default Statistics;
