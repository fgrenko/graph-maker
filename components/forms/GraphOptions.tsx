"use client";
import {Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {useForm} from "react-hook-form";
import {Button} from '@/components/ui/button';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {z} from "zod";
import {zodResolver} from "@hookform/resolvers/zod";
import {Input} from "@/components/ui/input";

interface ParserProps {
    headers: string[];
    data: object;
    onOptions: (graphOptions: GraphOptionsObject) => void;
}

const formSchema = z.object({
    x: z.string(),
    y: z.string(),
    type: z.string(),
});

const GraphOptions: React.FC<ParserProps> = ({headers, data, onOptions}) => {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        const returnObject: GraphOptionsObject = {
            x: values.x,
            y: values.y,
            type: values.type,
        }
        onOptions(returnObject);
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="w-2/3 space-y-6">
                <FormField
                    control={form.control}
                    name="x"
                    render={({field}) => (
                        <FormItem>
                            <FormLabel>X axis</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    name="y"
                    render={({field}) => (
                        <FormItem>
                            <FormLabel>Y axis</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    name="type"
                    render={({field}) => (
                        <FormItem>
                            <FormLabel>Type</FormLabel>
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
                <Button type="submit">Submit</Button>
            </form>
        </Form>
    );
};

export default GraphOptions;
