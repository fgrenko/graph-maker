import React, {useState, useEffect} from 'react';
// @ts-ignore
import Papa, {ParseResult} from 'papaparse';

interface ParserProps {
    rawData: string;
    delimiter: string;
    onParsed: (headers: string[], data: object) => void;
    parsingDone: boolean;
}

const Parser: React.FC<ParserProps> = ({rawData, delimiter, onParsed, parsingDone}) => {
    useEffect(() => {
            if (rawData.length > 0 && !parsingDone) {
                let modifiedData = rawData;
                if (modifiedData.includes('sep=')) {
                    modifiedData = modifiedData.substring(modifiedData.indexOf('\n') + 1);
                }
                Papa.parse(modifiedData, {
                    header: true,
                    delimiter,
                    dynamicTyping: true,
                    complete: (result: ParseResult<Record<string, string>[]>) => {
                        function convertValues(value: any) {
                            if (typeof value === 'string') {
                                // Remove '%' if it's the last character
                                if (value.endsWith('%')) {
                                    value = value.slice(0, -1);
                                }
                                // Replace ',' with '.' and parse to Number
                                const newValue = value.replace(',', '.');
                                return !isNaN(Number(newValue)) ? Number(newValue) : value;
                            } else {
                                return value;
                            }
                        }

                        function filterNullValues(item) {
                            return Object.fromEntries(
                                Object.entries(item).filter(([_, value]) => value !== null).map(([key, value]) => [key, convertValues(value)])
                            );
                        }


                        if (result.data && result.data.length > 0) {
                            const headers = Object.keys(result.data[0]);
                            const values = result.data.map(filterNullValues)
                                .filter(item => Object.keys(item).length > 0);
                            onParsed(headers, values);
                        }
                    }
                    ,
                });
            }
        }
        ,
        [rawData, delimiter, onParsed, parsingDone]
    )
    ;

    return null;
};

export default Parser;
