import React, {useState, useEffect} from 'react';
// @ts-ignore
import Papa, {ParseResult} from 'papaparse'; // Import ParseResult from 'papaparse'

interface ParserProps {
    rawData: string;
    delimiter: string;
    onParsed: (headers: string[], data: object) => void;
    parsingDone: boolean;
}

const Parser: React.FC<ParserProps> = ({rawData, delimiter, onParsed, parsingDone}) => {
    const [headers, setHeaders] = useState<string[]>([]);
    useEffect(() => {
        if (rawData.length > 0 && !parsingDone) {
            let skipRows = 0
            if (rawData.match(/"sep=/)) {
                const firstLineBreak = rawData.indexOf('\n')
                rawData = rawData.substring(firstLineBreak + 1, rawData.length)
            }
            Papa.parse(rawData, {
                header: true,
                delimiter: delimiter,
                dynamicTyping: true,
                complete: (result: ParseResult<Record<string, string>[]>) => {
                    if (result.data && result.data.length > 0) {
                        const headersArray = Object.keys(result.data[0])
                        const valuesObject = Object.values(result.data)
                        onParsed(headersArray, valuesObject)
                    }
                },
            });
        }

    }, [rawData,delimiter, onParsed, parsingDone]);

    return <></>;
};

export default Parser;
