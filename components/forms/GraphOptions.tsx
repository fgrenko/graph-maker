"use client";
import {Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {useForm} from "react-hook-form";
import {Button} from '@/components/ui/button';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {z} from "zod";
import {zodResolver} from "@hookform/resolvers/zod";
import {Input} from "@/components/ui/input";
import {useEffect, useState} from "react";

interface ParserProps {
    headers: string[];
    data: any;
    onOptions: (graphOptions: GraphOptionsObject) => void;
}

const formSchema = z.object({
    x: z.string().min(1),
    xDataType: z.string().min(1),
    y: z.string().min(1),
    yDataType: z.string().min(1),
    graphType: z.string().min(1),
});

const GraphOptions: React.FC<ParserProps> = ({headers, data, onOptions}) => {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
    });
    const [isHistogramType, setIsHistogramType] = useState(false);
    const [isBarType, setIsBarType] = useState(false);
    const [isLineType, setIsLineType] = useState(false);

    useEffect(() => {
        const graphType = form.watch('graphType');
        setIsHistogramType(graphType === 'histogram');
        setIsBarType(graphType === 'bar');
        setIsLineType(graphType === 'line');
        // Reset form values when graph type changes
        form.setValue('x', '');
        form.setValue('xDataType', '');
        form.setValue('y', '');
        form.setValue('yDataType', '');
    }, [form.watch('graphType')]); //TODO: vidi kako napravit efektivnije form.watch


    //TODO: opcije koji je tip podataka za odredeno polje
    function onSubmit(values: z.infer<typeof formSchema>) {
        const returnObject: GraphOptionsObject = {
            x: values.x,
            xDataType: values.xDataType,
            y: values.y,
            yDataType: values.yDataType,
            graphType: values.graphType,
        }
        onOptions(returnObject);
    }

    // TODO: vidi dal trebaju jos koji tipovi podataka
    // TODO: string na x-u moze ici samo kod bar grafova
    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="w-2/3 space-y-6">
                <FormField
                    control={form.control}
                    name="graphType"
                    render={({field}) => (
                        <FormItem>
                            <FormLabel>Graph Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select graph type"/>
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem key="histogram" value="histogram">Histogram</SelectItem>
                                    <SelectItem key="line" value="line">Line</SelectItem>
                                    <SelectItem key="bar" value="bar">Bar</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormDescription>

                            </FormDescription>
                            <FormMessage/>
                        </FormItem>
                    )}
                />
                <div className="flex ">
                    <FormField
                        control={form.control}
                        name="x"
                        render={({field}) => (
                            <FormItem>
                                <FormLabel>X axis</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}
                                        disabled={!form.watch('graphType')}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select label for X axis"/>
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {headers.map((header) => (
                                            <SelectItem key={header} value={header}>{header}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormDescription>

                                </FormDescription>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="xDataType"
                        render={({field}) => (
                            <FormItem>
                                <FormLabel>X axis data type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}
                                        disabled={!form.watch('graphType')}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select data type for X axis"/>
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {isHistogramType && (
                                            <SelectItem key="number" value="number">Number</SelectItem>
                                        )}
                                        {isLineType && (
                                            <>
                                                <SelectItem key="timestamp" value="timestamp">Timestamp</SelectItem>
                                                <SelectItem key="number" value="number">Number</SelectItem></>
                                        )}
                                        {isBarType && (
                                            <><SelectItem key="timestamp" value="timestamp">Timestamp</SelectItem>
                                                <SelectItem key="string" value="string">String</SelectItem>
                                                <SelectItem key="number" value="number">Number</SelectItem></>
                                        )}
                                    </SelectContent>
                                </Select>
                                <FormDescription>

                                </FormDescription>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex">
                    <FormField
                        control={form.control}
                        name="y"
                        render={({field}) => (
                            <FormItem>
                                <FormLabel>Y axis</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}
                                        disabled={!form.watch('graphType')}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select label for Y axis"/>
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {headers.map((header) => (
                                            <SelectItem key={header} value={header}>{header}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormDescription>

                                </FormDescription>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="yDataType"
                        render={({field}) => (
                            <FormItem>
                                <FormLabel>Y axis data type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}
                                        disabled={!form.watch('graphType')}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select data type for Y axis"/>
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem key="timestamp" value="timestamp">Timestamp</SelectItem>
                                        <SelectItem key="string" value="string">String</SelectItem>
                                        <SelectItem key="number" value="number">Number</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormDescription>

                                </FormDescription>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />
                </div>
                <Button type="submit" disabled={!form.formState.isValid}>Submit</Button>
            </form>
        </Form>
    );
};

export default GraphOptions;
