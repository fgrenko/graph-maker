import {z} from "zod";

const ACCEPTED_IMAGE_TYPES = ["text/csv", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"];

export const fileUploadSchema = z.object({
    file: z
        .custom<File>()
        .refine((file) => !!file, "File is required.")
        .refine((file) => ACCEPTED_IMAGE_TYPES.includes(file.type), "File type is not supported."),
});

