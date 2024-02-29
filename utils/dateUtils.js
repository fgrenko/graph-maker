import dayjs from "dayjs";

export function detectDateFormat(dateString) {
    if (typeof dateString !== "string") {
        return null;
    }
    const formats = [
        '%Y-%m-%d %H:%M:%S.%L',
        '%Y-%m-%d %H:%M:%S',
        'YYYY-MM-DDTHH:mm',
        '%Y-%m-%d',
        'YYYY-MM-DD',
        'MM-DD-YYYY',
        'DD-MM-YYYY',
    ];

    for (let format of formats) {
        if (dayjs(dateString, format).isValid()) {
            return format;
        }
    }

    return null;
}
