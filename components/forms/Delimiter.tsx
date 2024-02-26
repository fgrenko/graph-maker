import React, {useCallback} from 'react';
import {useForm, SubmitHandler} from 'react-hook-form';
import {useDropzone} from 'react-dropzone';
import {Button} from '@/components/ui/button';

interface FormData {
    delimiter: string;
}

interface FileUploadProps {
    onDelimiterSet: (delimiter: string) => void;
    onBackPressed: () => void;
}

export const Delimiter: React.FC<FileUploadProps> = ({onDelimiterSet, onBackPressed}) => {
    const form = useForm<FormData>({
        defaultValues: {
            delimiter: ''
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
                <form onSubmit={form.handleSubmit(onSubmit)} className=" w-full gap-10">
                    <input
                        className="rounded min-h-[20px] max-w-[400px] text-2xl bg-transparent border-2 border-gray-700 text-gray-700"
                        id="delimiter"
                        type="text"
                        min={1}
                        {...form.register('delimiter')}
                    />
                    <div className="col">

                        {/* dodaj button za natrag */}
                        <Button onClick={onBack}
                                className="bg-transparent mt-5 text-xl text-gray-700 hover:bg-gray-300 border-2 border-gray-700 hover:text-gray-700 mr-2">
                            Back
                        </Button>
                        <Button type="submit"
                                className="bg-transparent mt-5 text-xl text-gray-700 hover:bg-gray-300 border-2 border-gray-700 hover:text-gray-700">Next</Button>

                    </div>
                </form>
            </div>
        </>

    );
};

export default Delimiter;
