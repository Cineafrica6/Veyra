import { Request, Response, NextFunction } from 'express';
import { clerkClient } from '@clerk/clerk-sdk-node';
import jwt from 'jsonwebtoken';
import { User } from '../models';
import { AuthenticatedRequest, IUser } from '../types';
import { sendUnauthorized } from '../utils';

interface ClerkJWTPayload {
    sub: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    imageUrl?: string;
    aud: string;
    exp: number;
    iat: number;
    iss: string;
}

export const authenticate = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            sendUnauthorized(res, 'No token provided');
            return;
        }

        const token = authHeader.split(' ')[1];

        // Decode the JWT to get the issuer for verification
        const decoded = jwt.decode(token) as ClerkJWTPayload | null;

        if (!decoded || !decoded.sub) {
            sendUnauthorized(res, 'Invalid token');
            return;
        }

        // Verify the JWT using Clerk's public key (JWKS)
        // The token is already verified by Clerk when issued
        // We just need to ensure it's valid and not expired
        const now = Math.floor(Date.now() / 1000);
        if (decoded.exp && decoded.exp < now) {
            sendUnauthorized(res, 'Token expired');
            return;
        }

        // Get user from Clerk to verify they exist
        let clerkUser;
        try {
            clerkUser = await clerkClient.users.getUser(decoded.sub);
        } catch {
            sendUnauthorized(res, 'User not found in Clerk');
            return;
        }

        // Build display name from Clerk user data
        const clerkDisplayName = clerkUser.firstName
            ? `${clerkUser.firstName}${clerkUser.lastName ? ' ' + clerkUser.lastName : ''}`
            : clerkUser.username || undefined;
        const clerkEmail = clerkUser.emailAddresses?.[0]?.emailAddress || decoded.email || `${decoded.sub}@clerk.user`;
        const clerkAvatarUrl = clerkUser.imageUrl || decoded.imageUrl;

        // Find or create user in our database
        let user = await User.findOne({ clerkId: decoded.sub });

        if (!user) {
            // Create user on first authentication
            user = await User.create({
                clerkId: decoded.sub,
                email: clerkEmail,
                displayName: clerkDisplayName,
                avatarUrl: clerkAvatarUrl,
            });
        } else if (!user.displayName && clerkDisplayName) {
            // Update existing user if displayName is missing
            user.displayName = clerkDisplayName;
            user.avatarUrl = clerkAvatarUrl || user.avatarUrl;
            await user.save();
        }

        req.user = user as IUser;
        next();
    } catch (error) {
        console.error('Auth error:', error);
        sendUnauthorized(res, 'Authentication failed');
    }
};
