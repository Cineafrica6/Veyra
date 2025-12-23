import { Response, NextFunction } from 'express';
import { OrganizationMembership, TrackMembership, Track } from '../models';
import { AuthenticatedRequest, OrgRole } from '../types';
import { sendForbidden, sendNotFound } from '../utils';

/**
 * Middleware to check if user has required role in organization
 * Populates req.orgMembership
 */
export const requireOrgRole = (...allowedRoles: OrgRole[]) => {
    return async (
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const orgId = req.params.orgId || req.params.id;
            const userId = req.user?._id;

            if (!userId) {
                sendForbidden(res, 'User not authenticated');
                return;
            }

            const membership = await OrganizationMembership.findOne({
                userId,
                organizationId: orgId,
            });

            if (!membership) {
                sendForbidden(res, 'You are not a member of this organization');
                return;
            }

            if (!allowedRoles.includes(membership.role as OrgRole)) {
                sendForbidden(res, 'Insufficient permissions');
                return;
            }

            req.orgMembership = membership;
            next();
        } catch (error) {
            console.error('RBAC error:', error);
            sendForbidden(res, 'Permission check failed');
        }
    };
};

/**
 * Middleware to check if user is a member of the track
 * Populates req.trackMembership
 */
export const requireTrackMember = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const trackId = req.params.trackId || req.params.id;
        const userId = req.user?._id;

        if (!userId) {
            sendForbidden(res, 'User not authenticated');
            return;
        }

        const membership = await TrackMembership.findOne({
            userId,
            trackId,
        });

        if (!membership) {
            sendForbidden(res, 'You are not a member of this track');
            return;
        }

        req.trackMembership = membership;
        next();
    } catch (error) {
        console.error('Track member check error:', error);
        sendForbidden(res, 'Permission check failed');
    }
};

/**
 * Middleware to check if user is admin/owner of the track's organization
 * For admin-only operations on tracks
 */
export const requireTrackAdmin = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const trackId = req.params.trackId || req.params.id;
        const userId = req.user?._id;

        if (!userId) {
            sendForbidden(res, 'User not authenticated');
            return;
        }

        // Get the track to find its organization
        const track = await Track.findById(trackId);
        if (!track) {
            sendNotFound(res, 'Track not found');
            return;
        }

        // Check if user is admin/owner of the organization
        const membership = await OrganizationMembership.findOne({
            userId,
            organizationId: track.organizationId,
            role: { $in: ['owner', 'admin'] },
        });

        if (!membership) {
            sendForbidden(res, 'Only organization admins can perform this action');
            return;
        }

        req.orgMembership = membership;
        next();
    } catch (error) {
        console.error('Track admin check error:', error);
        sendForbidden(res, 'Permission check failed');
    }
};
