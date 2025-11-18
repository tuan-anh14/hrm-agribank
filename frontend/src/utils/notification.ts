import { message } from "antd";

export const isSuccessResponse = (res: any): boolean => {
    if (!res || typeof res !== "object") {
        return false;
    }

    if ("statusCode" in res && typeof res.statusCode === "number") {
        return res.statusCode < 400;
    }

    if ("success" in res) {
        return Boolean(res.success);
    }

    if (("id" in res && res.id) || ("data" in res && res.data)) {
        return true;
    }

    if ("message" in res && typeof res.message === "string" && res.message.trim()) {
        return true;
    }

    return false;
};

export const extractErrorMessage = (error: any, fallback: string): string => {
    let messageFromServer = error?.response?.data?.message ?? error?.response?.data ?? error?.message;
    if (Array.isArray(messageFromServer)) {
        messageFromServer = messageFromServer[0];
    }
    if (typeof messageFromServer === "string" && messageFromServer.trim()) {
        return messageFromServer;
    }
    return fallback;
};

export const notifySuccess = (content: string) => {
    message.success(content);
};

export const notifyError = (error: any, fallback: string) => {
    message.error(extractErrorMessage(error, fallback));
};

export const handleApiSuccess = (res: any, successMessage: string, fallbackMessage: string) => {
    if (isSuccessResponse(res)) {
        notifySuccess(successMessage);
        return true;
    }
    notifyError(res, fallbackMessage);
    return false;
};

