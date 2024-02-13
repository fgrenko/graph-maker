// FileUpload.tsx

import React, {useCallback, useState} from 'react';
import {useForm, SubmitHandler} from 'react-hook-form';
import {Button} from '@/components/ui/button';

interface FormData {
    file: FileList;
    delimiter: string;
}

interface FileUploadProps {
    onFileRead: (content: string, delimiter: string) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({onFileRead}) => {
    const allowedFileTypes = ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    const form = useForm<FormData>({
        defaultValues: {
            file: undefined,
            delimiter: ""
        },
    });

    const handleFileRead = useCallback(
        (e: ProgressEvent<FileReader>) => {
            if (e.target?.result) {
                const content = e.target.result.toString();
                const delimiter = form.getValues().delimiter || ","; // Default delimiter is ","
                onFileRead(content, delimiter);
            }
        },
        [onFileRead]
    );

    const onSubmit: SubmitHandler<FormData> = (data) => {
        const reader = new FileReader();
        reader.onloadend = handleFileRead;
        reader.readAsText(data.file[0]);
    };

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex w-full flex-col gap-10">
            <div className={`w-full h-full`}>
                <div className={`flex w-full flex-col  rounded-md p-5 transition duration-300 ease-in-out`}>
                    <label className="paragraph-semibold text-dark400_light800" htmlFor="file">
                        File
                    </label>
                    <p className="body-regular mt-2.5 text-light-500">Upload your .csv or .xlsx file</p>
                    <input
                        id="file"
                        type="file"
                        accept=".csv, .xlsx"
                        className="light-border-2 min-h-[56px] border mt-3.5 sm:w-auto"
                        {...form.register('file', {
                            required: 'File is required.',
                            validate: (value) => {
                                if (!value[0]) {
                                    return 'Please select a file.';
                                }

                                const fileType = value[0].type;
                                if (!allowedFileTypes.includes(fileType)) {
                                    return 'File type is not supported. Please upload a .csv or .xlsx file.';
                                }

                                return true;
                            },
                        })}
                    />
                    <p className="body-regular mt-2.5 text-light-500">Set your delimiter</p>
                    <input
                        id="delimiter"
                        type="text"
                        min={1}
                        {...form.register('delimiter')}
                    />

                </div>
                <Button type="submit">Submit</Button>
            </div>
        </form>
    );
};

export default FileUpload;
