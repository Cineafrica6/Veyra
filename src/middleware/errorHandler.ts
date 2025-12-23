import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';

export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    console.error('Error:', err);

    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            success: false,
            error: err.message,
        });
        return;
    }

    // MongoDB duplicate key error
    if ((err as any).code === 11000) {
        res.status(409).json({
            success: false,
            error: 'Duplicate entry. This resource already exists.',
        });
        return;
    }

    // MongoDB validation error
    if (err.name === 'ValidationError') {
        res.status(400).json({
            success: false,
            error: err.message,
        });
        return;
    }

    // MongoDB cast error (invalid ObjectId)
    if (err.name === 'CastError') {
        res.status(400).json({
            success: false,
            error: 'Invalid ID format',
        });
        return;
    }

    // Default error
    res.status(500).json({
        success: false,
        error: 'Internal server error',
    });
};
