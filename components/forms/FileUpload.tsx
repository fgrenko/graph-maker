import React, {useCallback, useEffect} from 'react';
import {useForm, SubmitHandler} from 'react-hook-form';
import {useDropzone} from 'react-dropzone';
import {Button} from '@/components/ui/button';

interface FormData {
    file: FileList;
}

interface FileUploadProps {
    onFileRead: (content: string) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({onFileRead}) => {
    const allowedFileTypes = {'text/csv': []};
    const form = useForm<FormData>({
        defaultValues: {
            file: undefined,
        },
    });

    const onDrop = useCallback((acceptedFiles) => {
        // Handle only one file
        form.setValue('file', acceptedFiles[0]);
    }, []);

    const {getRootProps, getInputProps, acceptedFiles} = useDropzone({
        onDrop,
        accept: allowedFileTypes,
        // Disable multiple file selection
        multiple: false,
    });
    useEffect(() => {
        // Trigger file read when a new file is selected
        if (acceptedFiles.length > 0) {
            const reader = new FileReader();
            reader.onloadend = (e: ProgressEvent<FileReader>) => {
                if (e.target?.result) {
                    const content = e.target.result.toString();
                    onFileRead(content);
                }
            };
            reader.readAsText(acceptedFiles[0]);
        }
    }, [acceptedFiles, form, onFileRead]);

    const onSubmit: SubmitHandler<FormData> = (data) => {
        // Submit logic if needed
    };

    return (
        <>
            <span className="text-gray-700 text-4xl">1. Select your file</span>
            <div className="my-5">
                <form onSubmit={form.handleSubmit(onSubmit)} className="flex w-full flex-col gap-10">
                    <div {...getRootProps()} className="flex items-center justify-center w-full">
                        <input {...getInputProps()} />
                        <div
                            className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-800 border-dashed rounded-lg cursor-pointer bg-transparent dark:hover:bg-gray-300 hover:bg-gray-300 dark:border-black dark:hover:border-black">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <svg className="w-8 h-8 mb-4 text-gray-700 dark:text-gray-300" aria-hidden="true"
                                     xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                                    <path
                                        stroke="currentColor"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                                    />
                                </svg>
                                <p className="mb-2 text-sm text-gray-700 dark:text-gray-300">
                                    <span className="font-semibold">Click to upload</span> or drag and drop
                                </p>
                                <p className="text-xs text-gray-700 dark:text-gray-300">CSV</p>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </>
    );
};

export default FileUpload;
