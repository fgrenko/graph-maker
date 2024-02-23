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
                    if (result.data && result.data.length > 0) {
                        const headers = Object.keys(result.data[0]);
                        const values = result.data.map(item =>

                            //TODO: mozda ce pucati ako ne treba mijenjati zarez
                            Object.entries(item).reduce((acc, [key, value]) => {
                                if (typeof value === 'string') {
                                    // Remove commas and replace with dots if present
                                    const newValue = value.replace(',', '.');
                                    // Check if the value is a string representing a number after replacing commas
                                    if (!isNaN(Number(newValue))) {
                                        // Convert the value to a number
                                        acc[key] = Number(newValue);
                                    } else {
                                        // If not a valid number, keep it as a string
                                        acc[key] = value;
                                    }
                                } else {
                                    // For non-string values, keep them unchanged
                                    acc[key] = value;
                                }
                                return acc;
                            }, {})
                        );

                        onParsed(headers, values);
                    }
                },
            });
        }
    }, [rawData, delimiter, onParsed, parsingDone]);

    return null;
};

export default Parser;
