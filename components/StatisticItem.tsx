import React from 'react';

interface StatisticItemProps {
    object: StatisticItem;
    index: number;
}

const StatisticItem: React.FC<StatisticItemProps> = ({object, index}) => {
        const isBoxPlotCategory = object.graphType === "box-plot-category";
        return (
            <div key={index} className="my-3 mr-1">
                <h3 className={`underline ${object.graphType === "box-plot-category" ? "" : "text-xl"}`}>{object.label}</h3>
                <div className="flex flex-col">
                    <span>Mean: {object.mean.toFixed(4)}</span>
                    <span>Median: {object.median.toFixed(4)}</span>
                    <span>Standard deviation: {object.deviation.toFixed(4)}</span>
                    <span>Skewness: {object.skew.toFixed(4)}</span>
                    {isBoxPlotCategory && <span>Min whisker: {object.minWhisker.toFixed(4)}</span>}
                    {isBoxPlotCategory && <span>Max whisker: {object.maxWhisker.toFixed(4)}</span>}
                    <span>Min: {object.min.toFixed(4)}</span>
                    <span>Max: {object.max.toFixed(4)}</span>
                </div>

            </div>
        );
    }
;

export default StatisticItem;
