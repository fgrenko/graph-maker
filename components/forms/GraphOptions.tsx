"use client";
import {Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {useForm} from "react-hook-form";
import {Button} from '@/components/ui/button';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {z} from "zod";
import {zodResolver} from "@hookform/resolvers/zod";
import React, {useEffect, useState} from "react";

interface ParserProps {
    headers: string[];
    data: any;
    onOptions: (graphOptions: GraphOptionsObject) => void;
    onBackPressed: () => void;
}

const formSchema = z.object({
    x: z.string().min(1),
    // y: z.array(z.string()),
    graphType: z.string().min(1),
    sorting: z.string().min(1),
});

const GraphOptions: React.FC<ParserProps> = ({headers, data, onOptions, onBackPressed}) => {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            sorting: "0",
        },
    });

    const [isHistogramType, setIsHistogramType] = useState(false);
    const [isBarType, setIsBarType] = useState(false);
    const [isLineType, setIsLineType] = useState(false);
    const [isMultilineType, setIsMultilineType] = useState(false);
    const [yOptions, setYOptions] = useState([{y: "", yDataType: ""}]);
    const [disabledOptions, setDisabledOptions] = useState({x: "", y: []});


    //Use effect for dynamic setting of selectOptions
    useEffect(() => {
        const graphType = form.watch('graphType');
        setIsHistogramType(graphType === 'histogram');
        setIsBarType(graphType === 'bar');
        setIsLineType(graphType === 'line');
        setIsMultilineType(graphType === 'multiline');
        setYOptions([yOptions[0]]);
        setDisabledOptions(disabledOptions => ({
            ...disabledOptions,
            y: [disabledOptions.y[0]]
        }))

    }, [form.watch('graphType')]); //TODO: vidi kako napravit efektivnije form.watch

    const handleAddOption = () => {
        setYOptions([...yOptions, {y: "", yDataType: ""}]);
    };

    const handleRemoveOption = (index) => {
        const newOptions = [...yOptions];
        newOptions.splice(index, 1);
        setYOptions(newOptions);

        disabledOptions.y.splice(index, 1)
        setDisabledOptions(disabledOptions => ({
            ...disabledOptions,
            y: disabledOptions.y
        }))

    };

    const handleYChange = (index, key, value) => {
        const newOptions = [...yOptions];
        newOptions[index][key] = value;
        setYOptions(newOptions);

        disabledOptions.y[index] = value;
        setDisabledOptions(disabledOptions => ({
            ...disabledOptions,
            y: disabledOptions.y
        }))

    };

    const handleXChange = (value) => {
        setDisabledOptions(disabledOptions => ({
            ...disabledOptions,
            x: value
        }))
    }


    //TODO: opcije koji je tip podataka za odredeno polje
    function onSubmit(values: z.infer<typeof formSchema>) {
        const returnObject: GraphOptionsObject = {
            x: values.x,
            y: yOptions.map((item) => item.y),
            graphType: values.graphType,
            sorting: values.sorting,
        }
        onOptions(returnObject);
    }

    const onBack = () => {
        onBackPressed()
    }

    // TODO: vidi dal trebaju jos koji tipovi podataka
    // TODO: string na x-u moze ici samo kod bar grafova
    return (
        <>
            <span className="text-gray-700 text-4xl">
                3. Choose your graph options
            </span>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="w-2/3 space-y-6 mt-5 text-gray-700">
                    <FormField
                        control={form.control}
                        name="graphType"
                        render={({field}) => (
                            <FormItem className="max-w-[400px]">
                                <FormLabel className="text-xl">Graph Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="border-gray-700">
                                            <SelectValue placeholder="Select graph type"/>
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-gray-200 text-gray-700 text-2xl">
                                        <SelectItem key="histogram" value="histogram">Histogram</SelectItem>
                                        <SelectItem key="line" value="line">Line</SelectItem>
                                        <SelectItem key="bar" value="bar">Bar</SelectItem>
                                        <SelectItem key="multiline" value="multiline">Multiline</SelectItem>
                                        <SelectItem key="box-plot" value="box-plot">Box plot</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormDescription>

                                </FormDescription>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />
                    <div className="flex">
                        <FormField
                            control={form.control}
                            name="x"
                            render={({field}) => (
                                <FormItem className="mr-2 max-w-[200px]">
                                    <FormLabel className="text-xl">X value</FormLabel>
                                    <Select
                                        onValueChange={(e) => {
                                            handleXChange(e);
                                            return field.onChange(e);
                                        }}
                                        defaultValue={field.value}
                                        disabled={!form.watch('graphType')}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="border-gray-700">
                                                <SelectValue placeholder="Select label for X axis"/>
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="bg-gray-200 text-gray-700 text-2xl">
                                            {headers.map((header) => (
                                                <SelectItem key={header} value={header}
                                                            disabled={[disabledOptions.x, ...disabledOptions.y].includes(header) && header !== field.value}
                                                >{header}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>

                                    </FormDescription>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                        <span className="text-sm mt-11 ml-2 text-gray-500">
                            {xDataTypeValue(form.watch('graphType'))}
                        </span>

                    </div>

                    <div>
                        {yOptions.map((option, index) => (

                            <div key={index} className="flex mb-2">
                                <div className="flex-col">
                                    <FormLabel className="text-xl">Y
                                        value {isMultilineType && "#" + (index + 1)}</FormLabel>
                                    <Select value={option.y} onValueChange={(e) => handleYChange(index, "y", e)}
                                            disabled={!form.watch('graphType') || form.watch('graphType') == 'histogram'}
                                            required={form.watch('graphType') !== 'histogram'}
                                    >
                                        < FormControl>
                                            <SelectTrigger className="border-gray-700">
                                                < SelectValue placeholder="Select label for Y axis"/>
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="bg-gray-200 text-gray-700 text-2xl">
                                            {headers.map((header) => (
                                                <SelectItem key={header} value={header}
                                                            disabled={[disabledOptions.x, ...disabledOptions.y].includes(header) && header !== option.y}
                                                >{header}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <span className="text-sm mt-10 ml-2 text-gray-500">
                            {yDataTypeValue(form.watch('graphType'))}
                        </span>
                                {index > 0 && <Button onClick={() => handleRemoveOption(index)}
                                                      type="button"
                                                      className="bg-transparent mt-7 ml-2 text-gray-700 hover:bg-gray-200 border border-gray-700 hover:text-gray-700">Remove</Button>}

                            </div>

                        ))}
                        {isMultilineType && <Button onClick={handleAddOption}
                                                    type="button"
                                                    className="bg-transparent mt-5 text-gray-700 hover:bg-gray-200 border border-gray-700 hover:text-gray-700">Add
                            new Y value</Button>}

                    </div>
                    {isBarType && <FormField
                        control={form.control}
                        name="sorting"
                        render={({field}) => (
                            <FormItem className="max-w-[400px]">
                                <FormLabel className="text-sm">Sorting</FormLabel>
                                <Select onValueChange={(e) => field.onChange(e)} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="border-gray-700">
                                            <SelectValue placeholder="Select graph type"/>
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-gray-200 text-gray-700 text-2xl">
                                        <SelectItem key="0" value="0"> Default</SelectItem>
                                        <SelectItem key="1" value="1">Alphabetical</SelectItem>
                                        <SelectItem key="2" value="2">Alphabetical, descending</SelectItem>
                                        <SelectItem key="3" value="3">Frequency, ascending</SelectItem>
                                        <SelectItem key="4" value="4">Frequency, descending</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormDescription>

                                </FormDescription>
                                <FormMessage/>
                            </FormItem>
                        )}/>}


                    <Button onClick={onBack}
                            className="bg-transparent mt-5 text-xl text-gray-700 hover:bg-gray-200 border-2 border-gray-700 hover:text-gray-700 mr-2">
                        Back
                    </Button>
                    <Button type="submit"
                            className="bg-transparent mt-5 text-xl text-gray-700 hover:bg-gray-200 border-2 border-gray-700 hover:text-gray-700">Next</Button>

                </form>
            </Form>
        </>

    );
};

export default GraphOptions;


function xDataTypeValue(type: string) {
    switch (type) {
        case "histogram":
            return "Data type: number";
        case "bar":
        case "box-plot":
            return "Data type: string";
        case "line":
        case "multiline":
            return "Data type: timestamp";
    }
}

function yDataTypeValue(type: string) {
    switch (type) {
        case "histogram":
            return "";
        case "bar":
        case "line":
        case "multiline":
        case "box-plot":
            return "Data type: number";
    }
}
