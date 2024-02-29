"use client"
import {useState} from "react";
import Parser from "@/components/Parser";
import {FileUpload} from "@/components/forms/FileUpload";
import GraphOptions from "@/components/forms/GraphOptions";
import Delimiter from "@/components/forms/Delimiter";
import Graph from "@/components/Graph";

export default function Home() {

    const [rawData, setRawData] = useState<string>("");
    const [delimiter, setDelimiter] = useState<string>("");
    const [headers, setHeaders] = useState<string[]>([]);
    const [data, setData] = useState<any>([]);
    const [parsingDone, setParsingDone] = useState<boolean>(false);
    const [fileSelected, setFileSelected] = useState<boolean>(false);
    const [graphOptions, setGraphOptions] = useState<GraphOptionsObject>();

    const handleFileRead = (content: string) => {
        if (content.length > 0) {
            setRawData(content);
            setParsingDone(false);
            setFileSelected(true);
        }
    };

    const handleDelimiterSet = (delimiter: string) => {
        if (delimiter.length > 0) {
            setDelimiter(delimiter)
        }
    }

    const handleParsedData = (headers: string[], data: any) => {
        setHeaders(headers)
        setData(data)
        setParsingDone(true)
    };

    const handleGraphOptions = (graphOptions: GraphOptionsObject) => {
        setGraphOptions(graphOptions)
    }

    const handleNewFileUpload = () => {
        setFileSelected(false)
        setRawData("")
        setParsingDone(false)
    }

    const handleNewGraphOptions = () => {
        setGraphOptions(undefined)
    }

    const handleNewDelimiter = () => {
        setParsingDone(false)
        setDelimiter("")
        setData(undefined)
        setHeaders([])
    }

    return (
        <>
            <div className="px-5">
                {!parsingDone && !fileSelected && <FileUpload onFileRead={handleFileRead}/>}
                {!parsingDone && fileSelected &&
                    <Delimiter onDelimiterSet={handleDelimiterSet} onBackPressed={handleNewFileUpload}/>}
                {!parsingDone && rawData && delimiter &&
                    <Parser rawData={rawData} delimiter={delimiter} onParsed={handleParsedData}
                            parsingDone={parsingDone}/>}
                {parsingDone && !graphOptions &&
                    <GraphOptions headers={headers} data={data} onOptions={handleGraphOptions}
                                  onBackPressed={handleNewDelimiter}/>}

                {parsingDone && graphOptions && <Graph headers={headers} data={data} graphOptions={graphOptions}
                                                       onBackPressed={handleNewGraphOptions}/>}

            </div>


        </>
    );

}
