import React, {useCallback} from 'react';
import {useForm, SubmitHandler} from 'react-hook-form';
import {useDropzone} from 'react-dropzone';
import {Button} from '@/components/ui/button';
import {Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {z} from "zod";
import {zodResolver} from "@hookform/resolvers/zod";
import {Input} from "@/components/ui/input";

interface FormData {
    delimiter: string;
}

interface FileUploadProps {
    onDelimiterSet: (delimiter: string) => void;
    onBackPressed: () => void;
}

const formSchema = z.object({
    delimiter: z.string().min(1),
});

export const Delimiter: React.FC<FileUploadProps> = ({onDelimiterSet, onBackPressed}) => {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            delimiter: "",
        },

    });

    const onSubmit: SubmitHandler<FormData> = (data) => {

        const delimiter = form.getValues().delimiter || ',';
        onDelimiterSet(delimiter);
    };

    const onBack = () => {
        onBackPressed()
    }
    return (
        <>
            <span className="text-gray-700 text-4xl">
                2. Select your delimiter
            </span>
            <div className="flex flex-col my-5">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className=" w-full gap-10">
                        <FormField
                            control={form.control}
                            name="delimiter"
                            render={({field}) => (
                                <FormItem className="max-w-[300px]">
                                    <FormLabel className="text-xl"></FormLabel>
                                    <Input type="text"
                                           className="rounded min-h-[20px] max-w-[400px] text-2xl bg-transparent border-2 border-gray-700 text-gray-700"
                                           {...field} />
                                    <FormDescription>

                                    </FormDescription>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />

                        <div className="col">

                            {/* dodaj button za natrag */}
                            <Button onClick={onBack}
                                    className="bg-transparent mt-5 text-xl text-gray-700 hover:bg-gray-300 border-2 border-gray-700 hover:text-gray-700 mr-2">
                                Back
                            </Button>
                            <Button type="submit"
                                    className="bg-transparent mt-5 text-xl text-gray-700 hover:bg-gray-300 border-2 border-gray-700 hover:text-gray-700"
                            >Next</Button>

                        </div>
                    </form>
                </Form>
            </div>

        </>

    );
};

export default Delimiter;
