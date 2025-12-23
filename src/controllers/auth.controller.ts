import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { sendSuccess } from '../utils';

/**
 * GET /api/auth/me
 * Get current authenticated user profile
 */
export const getMe = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    const user = req.user;

    sendSuccess(res, {
        id: user?._id,
        email: user?.email,
        displayName: user?.displayName,
        avatarUrl: user?.avatarUrl,
        createdAt: user?.createdAt,
    });
};

/**
 * PATCH /api/auth/me
 * Update current user profile
 */
export const updateMe = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    const user = req.user;
    const { displayName, avatarUrl } = req.body;

    if (displayName !== undefined) {
        user!.displayName = displayName;
    }
    if (avatarUrl !== undefined) {
        user!.avatarUrl = avatarUrl;
    }

    await user!.save();

    sendSuccess(res, {
        id: user?._id,
        email: user?.email,
        displayName: user?.displayName,
        avatarUrl: user?.avatarUrl,
    });
};
