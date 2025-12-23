import { Response } from 'express';

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

export const sendSuccess = <T>(
    res: Response,
    data: T,
    message?: string,
    statusCode: number = 200
): Response => {
    return res.status(statusCode).json({
        success: true,
        data,
        message,
    } as ApiResponse<T>);
};

export const sendError = (
    res: Response,
    error: string,
    statusCode: number = 400
): Response => {
    return res.status(statusCode).json({
        success: false,
        error,
    } as ApiResponse);
};

export const sendCreated = <T>(
    res: Response,
    data: T,
    message?: string
): Response => {
    return sendSuccess(res, data, message, 201);
};

export const sendNotFound = (
    res: Response,
    message: string = 'Resource not found'
): Response => {
    return sendError(res, message, 404);
};

export const sendUnauthorized = (
    res: Response,
    message: string = 'Unauthorized'
): Response => {
    return sendError(res, message, 401);
};

export const sendForbidden = (
    res: Response,
    message: string = 'Access denied'
): Response => {
    return sendError(res, message, 403);
};
