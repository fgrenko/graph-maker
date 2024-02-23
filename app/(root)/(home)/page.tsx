"use client"
import {useState} from "react";
import Parser from "@/components/Parser";
import {FileUpload} from "@/components/forms/FileUpload";
import GraphOptions from "@/components/forms/GraphOptions";
import Graph from "@/components/Graph";

export default function Home() {

    const [rawData, setRawData] = useState<string>("");
    const [delimiter, setDelimiter] = useState<string>("");
    const [headers, setHeaders] = useState<string[]>([]);
    const [data, setData] = useState<any>([]);
    const [parsingDone, setParsingDone] = useState<boolean>(false);
    const [graphOptions, setGraphOptions] = useState<GraphOptionsObject>();

    const handleFileRead = (content: string, delimiter: string) => {
        if (content.length > 0 && delimiter.length > 0) {
            setRawData(content);
            setDelimiter(delimiter);
            setParsingDone(false);
        }
    };

    const handleParsedData = (headers: string[], data: any) => {
        setHeaders(headers)
        setData(data)
        setParsingDone(true)
    };

    const handleGraphOptions = (graphOptions: GraphOptionsObject) => {
        setGraphOptions(graphOptions)
    }

    return (
        <>

            {!parsingDone && <FileUpload onFileRead={handleFileRead}/>}
            {!parsingDone && rawData &&
                <Parser rawData={rawData} delimiter={delimiter} onParsed={handleParsedData}
                        parsingDone={parsingDone}/>}

            {parsingDone && !graphOptions &&
                <GraphOptions headers={headers} data={data} onOptions={handleGraphOptions}/>}
            {parsingDone && graphOptions && <Graph headers={headers} data={data} graphOptions={graphOptions}/>}
        </>
    );

}
