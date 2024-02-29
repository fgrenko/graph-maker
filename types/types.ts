interface GraphOptionsObject {
    x: string,
    y: string[],
    graphType: string,
}
interface StatisticItem {
    label: string;
    mean: number | undefined;
    median: number | undefined;
    deviation: number | undefined;
    min: number;
    max: number;
    skew: number;
    q1: number;
    q3: number;
    iqr: number;
    minWhisker: number;
    maxWhisker: number;
    graphType: string;
}
