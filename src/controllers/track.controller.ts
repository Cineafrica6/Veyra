import { Response } from 'express';
import { Track, TrackMembership, OrganizationMembership } from '../models';
import { AuthenticatedRequest, WeekDay } from '../types';
import {
    sendSuccess,
    sendCreated,
    sendError,
    sendNotFound,
    generateInviteCode,
} from '../utils';

/**
 * POST /api/organizations/:orgId/tracks
 * Create a new track (owner/admin only)
 */
export const createTrack = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    const { orgId } = req.params;
    const userId = req.user!._id;
    const {
        name,
        description,
        weekStartDay = 1, // Monday default
        minScore = 0,
        maxScore = 10,
        maxMembers,
    } = req.body;

    if (!name || name.trim().length < 2) {
        sendError(res, 'Track name must be at least 2 characters');
        return;
    }

    if (maxScore <= minScore) {
        sendError(res, 'maxScore must be greater than minScore');
        return;
    }

    const track = await Track.create({
        organizationId: orgId,
        name: name.trim(),
        description: description?.trim(),
        weekStartDay,
        minScore,
        maxScore,
        maxMembers,
        inviteCode: generateInviteCode(),
        inviteEnabled: true,
        memberCount: 1, // Creator is a member
    });

    // Add creator as track admin
    await TrackMembership.create({
        userId,
        trackId: track._id,
        role: 'admin',
    });

    sendCreated(res, {
        id: track._id,
        name: track.name,
        description: track.description,
        weekStartDay: track.weekStartDay,
        minScore: track.minScore,
        maxScore: track.maxScore,
        inviteCode: track.inviteCode,
        inviteEnabled: track.inviteEnabled,
        maxMembers: track.maxMembers,
        memberCount: track.memberCount,
    });
};

/**
 * GET /api/organizations/:orgId/tracks
 * List tracks in an organization
 * - Admins/Owners see all tracks
 * - Members see only tracks they've joined
 */
export const listTracks = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    const { orgId } = req.params;
    const userId = req.user!._id;
    const membership = req.orgMembership;

    let tracks;

    if (membership?.role === 'owner' || membership?.role === 'admin') {
        // Admins see all tracks
        tracks = await Track.find({ organizationId: orgId }).lean();
    } else {
        // Members see only joined tracks
        const trackMemberships = await TrackMembership.find({ userId }).lean();
        const trackIds = trackMemberships.map((m) => m.trackId);
        tracks = await Track.find({
            organizationId: orgId,
            _id: { $in: trackIds },
        }).lean();
    }

    // Don't expose invite codes to regular members
    const result = tracks.map((t: any) => ({
        id: t._id,
        name: t.name,
        description: t.description,
        weekStartDay: t.weekStartDay,
        minScore: t.minScore,
        maxScore: t.maxScore,
        memberCount: t.memberCount,
        ...(membership?.role !== 'member' && {
            inviteCode: t.inviteCode,
            inviteEnabled: t.inviteEnabled,
            maxMembers: t.maxMembers,
        }),
    }));

    sendSuccess(res, result);
};

/**
 * GET /api/tracks/my-tracks
 * Get all tracks the current user is a member of (across all organizations)
 */
export const getMyTracks = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    const userId = req.user!._id;

    // Find all track memberships for this user
    const trackMemberships = await TrackMembership.find({ userId }).lean();
    const trackIds = trackMemberships.map((m) => m.trackId);

    // Get all tracks
    const tracks = await Track.find({ _id: { $in: trackIds } })
        .populate('organizationId', 'name')
        .lean();

    const result = tracks.map((t: any) => ({
        id: t._id,
        name: t.name,
        description: t.description,
        organizationName: t.organizationId?.name,
        organizationId: t.organizationId?._id,
        weekStartDay: t.weekStartDay,
        memberCount: t.memberCount,
    }));

    sendSuccess(res, { tracks: result });
};

/**
 * GET /api/tracks/:id
 * Get track details
 */
export const getTrack = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    const { id } = req.params;

    const track = await Track.findById(id);
    if (!track) {
        sendNotFound(res, 'Track not found');
        return;
    }

    // Check if user is admin of this track's org
    const orgMembership = await OrganizationMembership.findOne({
        userId: req.user!._id,
        organizationId: track.organizationId,
    });

    const isAdmin =
        orgMembership?.role === 'owner' || orgMembership?.role === 'admin';

    sendSuccess(res, {
        id: track._id,
        name: track.name,
        description: track.description,
        weekStartDay: track.weekStartDay,
        minScore: track.minScore,
        maxScore: track.maxScore,
        memberCount: track.memberCount,
        ...(isAdmin && {
            inviteCode: track.inviteCode,
            inviteEnabled: track.inviteEnabled,
            maxMembers: track.maxMembers,
        }),
    });
};

/**
 * PATCH /api/tracks/:id
 * Update track (admin only)
 */
export const updateTrack = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    const { id } = req.params;
    const { name, description, weekStartDay, minScore, maxScore, maxMembers } =
        req.body;

    const track = await Track.findById(id);
    if (!track) {
        sendNotFound(res, 'Track not found');
        return;
    }

    if (name !== undefined) track.name = name.trim();
    if (description !== undefined) track.description = description?.trim();
    if (weekStartDay !== undefined) track.weekStartDay = weekStartDay as WeekDay;
    if (minScore !== undefined) track.minScore = minScore;
    if (maxScore !== undefined) track.maxScore = maxScore;
    if (maxMembers !== undefined) track.maxMembers = maxMembers;

    await track.save();

    sendSuccess(res, {
        id: track._id,
        name: track.name,
        description: track.description,
        weekStartDay: track.weekStartDay,
        minScore: track.minScore,
        maxScore: track.maxScore,
        inviteCode: track.inviteCode,
        inviteEnabled: track.inviteEnabled,
        maxMembers: track.maxMembers,
        memberCount: track.memberCount,
    });
};

/**
 * POST /api/tracks/join
 * Join track via invite code
 */
export const joinTrack = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    const { inviteCode } = req.body;
    const userId = req.user!._id;

    if (!inviteCode) {
        sendError(res, 'Invite code is required');
        return;
    }

    const track = await Track.findOne({ inviteCode: inviteCode.toUpperCase() });
    if (!track) {
        sendNotFound(res, 'Invalid invite code');
        return;
    }

    if (!track.inviteEnabled) {
        sendError(res, 'Invites are disabled for this track');
        return;
    }

    // Check max members
    if (track.maxMembers && track.memberCount >= track.maxMembers) {
        sendError(res, 'This track has reached its member limit');
        return;
    }

    // Check if user is member of the organization
    const orgMembership = await OrganizationMembership.findOne({
        userId,
        organizationId: track.organizationId,
    });

    // If not in org, add them as member
    if (!orgMembership) {
        await OrganizationMembership.create({
            userId,
            organizationId: track.organizationId,
            role: 'member',
        });
    }

    // Check if already a track member
    const existingMembership = await TrackMembership.findOne({
        userId,
        trackId: track._id,
    });

    if (existingMembership) {
        sendError(res, 'You are already a member of this track', 409);
        return;
    }

    // Create track membership
    await TrackMembership.create({
        userId,
        trackId: track._id,
    });

    // Increment member count
    track.memberCount += 1;
    await track.save();

    sendSuccess(res, {
        trackId: track._id,
        trackName: track.name,
        message: 'Successfully joined the track',
    });
};

/**
 * POST /api/tracks/:id/regenerate-invite
 * Regenerate invite code (admin only)
 */
export const regenerateInvite = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    const { id } = req.params;

    const track = await Track.findById(id);
    if (!track) {
        sendNotFound(res, 'Track not found');
        return;
    }

    track.inviteCode = generateInviteCode();
    await track.save();

    sendSuccess(res, {
        inviteCode: track.inviteCode,
    });
};

/**
 * PATCH /api/tracks/:id/invite
 * Enable/disable invites (admin only)
 */
export const toggleInvite = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    const { id } = req.params;
    const { enabled } = req.body;

    const track = await Track.findById(id);
    if (!track) {
        sendNotFound(res, 'Track not found');
        return;
    }

    track.inviteEnabled = Boolean(enabled);
    await track.save();

    sendSuccess(res, {
        inviteEnabled: track.inviteEnabled,
    });
};

/**
 * GET /api/tracks/:id/members
 * List track members
 */
export const listTrackMembers = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    const { id } = req.params;

    const memberships = await TrackMembership.find({ trackId: id })
        .populate('userId', 'email displayName avatarUrl')
        .lean();

    const members = memberships.map((m: any) => ({
        userId: m.userId._id,
        email: m.userId.email,
        displayName: m.userId.displayName,
        avatarUrl: m.userId.avatarUrl,
        role: m.role,
        joinedAt: m.joinedAt,
    }));

    sendSuccess(res, members);
};

/**
 * POST /api/tracks/:id/members
 * Add member by email (track admin only)
 */
export const addTrackMember = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    const { id } = req.params;
    const { email, role = 'member' } = req.body;
    const userId = req.user!._id;

    if (!email) {
        sendError(res, 'Email is required');
        return;
    }

    const track = await Track.findById(id);
    if (!track) {
        sendNotFound(res, 'Track not found');
        return;
    }

    // Check if requester is track admin
    const requesterMembership = await TrackMembership.findOne({
        userId,
        trackId: id,
    });

    if (requesterMembership?.role !== 'admin') {
        // Also allow org admins/owners
        const orgMembership = await OrganizationMembership.findOne({
            userId,
            organizationId: track.organizationId,
        });
        if (orgMembership?.role !== 'owner' && orgMembership?.role !== 'admin') {
            sendError(res, 'Only track or org admins can add members', 403);
            return;
        }
    }

    // Find user by email
    const { User } = await import('../models');
    const targetUser = await User.findOne({ email: email.toLowerCase() });
    if (!targetUser) {
        sendNotFound(res, 'User not found with this email');
        return;
    }

    // Check if already a member
    const existingMembership = await TrackMembership.findOne({
        userId: targetUser._id,
        trackId: id,
    });

    if (existingMembership) {
        sendError(res, 'User is already a member of this track', 409);
        return;
    }

    // Check max members
    if (track.maxMembers && track.memberCount >= track.maxMembers) {
        sendError(res, 'Track has reached its member limit');
        return;
    }

    // Add to org if not already a member
    const orgMembership = await OrganizationMembership.findOne({
        userId: targetUser._id,
        organizationId: track.organizationId,
    });

    if (!orgMembership) {
        await OrganizationMembership.create({
            userId: targetUser._id,
            organizationId: track.organizationId,
            role: 'member',
        });
    }

    // Create track membership
    await TrackMembership.create({
        userId: targetUser._id,
        trackId: id,
        role: role === 'admin' ? 'admin' : 'member',
    });

    // Update member count
    track.memberCount += 1;
    await track.save();

    sendCreated(res, {
        userId: targetUser._id,
        email: targetUser.email,
        displayName: targetUser.displayName,
        role,
        message: 'Member added successfully',
    });
};

/**
 * POST /api/tracks/:id/members/:userId/ban
 * Ban a member (track admin only)
 */
export const banMember = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    const { id, targetUserId } = req.params;
    const requesterId = req.user!._id;

    const track = await Track.findById(id);
    if (!track) {
        sendNotFound(res, 'Track not found');
        return;
    }

    // Check if requester is track admin or org admin
    const requesterTrackMembership = await TrackMembership.findOne({
        userId: requesterId,
        trackId: id,
    });

    const requesterOrgMembership = await OrganizationMembership.findOne({
        userId: requesterId,
        organizationId: track.organizationId,
    });

    const isAdmin =
        requesterTrackMembership?.role === 'admin' ||
        requesterOrgMembership?.role === 'owner' ||
        requesterOrgMembership?.role === 'admin';

    if (!isAdmin) {
        sendError(res, 'Only admins can ban members', 403);
        return;
    }

    // Find the target member
    const targetMembership = await TrackMembership.findOne({
        userId: targetUserId,
        trackId: id,
    });

    if (!targetMembership) {
        sendNotFound(res, 'Member not found');
        return;
    }

    // Can't ban admins
    if (targetMembership.role === 'admin') {
        sendError(res, 'Cannot ban track admins');
        return;
    }

    // Can't ban yourself
    if (targetUserId === requesterId.toString()) {
        sendError(res, 'Cannot ban yourself');
        return;
    }

    targetMembership.status = 'banned';
    targetMembership.bannedAt = new Date();
    await targetMembership.save();

    sendSuccess(res, { message: 'Member banned successfully' });
};

/**
 * DELETE /api/tracks/:id/members/:targetUserId/ban
 * Unban a member (track admin only)
 */
export const unbanMember = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    const { id, targetUserId } = req.params;
    const requesterId = req.user!._id;

    const track = await Track.findById(id);
    if (!track) {
        sendNotFound(res, 'Track not found');
        return;
    }

    // Check if requester is track admin or org admin
    const requesterTrackMembership = await TrackMembership.findOne({
        userId: requesterId,
        trackId: id,
    });

    const requesterOrgMembership = await OrganizationMembership.findOne({
        userId: requesterId,
        organizationId: track.organizationId,
    });

    const isAdmin =
        requesterTrackMembership?.role === 'admin' ||
        requesterOrgMembership?.role === 'owner' ||
        requesterOrgMembership?.role === 'admin';

    if (!isAdmin) {
        sendError(res, 'Only admins can unban members', 403);
        return;
    }

    const targetMembership = await TrackMembership.findOne({
        userId: targetUserId,
        trackId: id,
    });

    if (!targetMembership) {
        sendNotFound(res, 'Member not found');
        return;
    }

    targetMembership.status = 'active';
    targetMembership.bannedAt = undefined;
    await targetMembership.save();

    sendSuccess(res, { message: 'Member unbanned successfully' });
};

/**
 * POST /api/tracks/:id/members/:targetUserId/suspend
 * Suspend a member (track admin only)
 */
export const suspendMember = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    const { id, targetUserId } = req.params;
    const { duration } = req.body; // Duration in days (optional, null = indefinite)
    const requesterId = req.user!._id;

    const track = await Track.findById(id);
    if (!track) {
        sendNotFound(res, 'Track not found');
        return;
    }

    const requesterTrackMembership = await TrackMembership.findOne({
        userId: requesterId,
        trackId: id,
    });

    const requesterOrgMembership = await OrganizationMembership.findOne({
        userId: requesterId,
        organizationId: track.organizationId,
    });

    const isAdmin =
        requesterTrackMembership?.role === 'admin' ||
        requesterOrgMembership?.role === 'owner' ||
        requesterOrgMembership?.role === 'admin';

    if (!isAdmin) {
        sendError(res, 'Only admins can suspend members', 403);
        return;
    }

    const targetMembership = await TrackMembership.findOne({
        userId: targetUserId,
        trackId: id,
    });

    if (!targetMembership) {
        sendNotFound(res, 'Member not found');
        return;
    }

    if (targetMembership.role === 'admin') {
        sendError(res, 'Cannot suspend track admins');
        return;
    }

    targetMembership.status = 'suspended';
    targetMembership.suspendedAt = new Date();
    if (duration) {
        targetMembership.suspendedUntil = new Date(Date.now() + duration * 24 * 60 * 60 * 1000);
    } else {
        targetMembership.suspendedUntil = undefined;
    }
    await targetMembership.save();

    sendSuccess(res, {
        message: 'Member suspended successfully',
        suspendedUntil: targetMembership.suspendedUntil,
    });
};

/**
 * DELETE /api/tracks/:id/members/:targetUserId/suspend
 * Unsuspend a member (track admin only)
 */
export const unsuspendMember = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    const { id, targetUserId } = req.params;
    const requesterId = req.user!._id;

    const track = await Track.findById(id);
    if (!track) {
        sendNotFound(res, 'Track not found');
        return;
    }

    const requesterTrackMembership = await TrackMembership.findOne({
        userId: requesterId,
        trackId: id,
    });

    const requesterOrgMembership = await OrganizationMembership.findOne({
        userId: requesterId,
        organizationId: track.organizationId,
    });

    const isAdmin =
        requesterTrackMembership?.role === 'admin' ||
        requesterOrgMembership?.role === 'owner' ||
        requesterOrgMembership?.role === 'admin';

    if (!isAdmin) {
        sendError(res, 'Only admins can unsuspend members', 403);
        return;
    }

    const targetMembership = await TrackMembership.findOne({
        userId: targetUserId,
        trackId: id,
    });

    if (!targetMembership) {
        sendNotFound(res, 'Member not found');
        return;
    }

    targetMembership.status = 'active';
    targetMembership.suspendedAt = undefined;
    targetMembership.suspendedUntil = undefined;
    await targetMembership.save();

    sendSuccess(res, { message: 'Member unsuspended successfully' });
};

/**
 * POST /api/tracks/:id/members/:targetUserId/promote
 * Promote member to track admin
 */
export const promoteToAdmin = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    const { id, targetUserId } = req.params;
    const requesterId = req.user!._id;

    const track = await Track.findById(id);
    if (!track) {
        sendNotFound(res, 'Track not found');
        return;
    }

    // Only org owners/admins can promote track admins
    const requesterOrgMembership = await OrganizationMembership.findOne({
        userId: requesterId,
        organizationId: track.organizationId,
    });

    if (!requesterOrgMembership || !['owner', 'admin'].includes(requesterOrgMembership.role)) {
        sendError(res, 'Only organization owners/admins can promote track admins', 403);
        return;
    }

    const targetMembership = await TrackMembership.findOne({
        userId: targetUserId,
        trackId: id,
    });

    if (!targetMembership) {
        sendNotFound(res, 'Member not found');
        return;
    }

    targetMembership.role = 'admin';
    await targetMembership.save();

    sendSuccess(res, { message: 'Member promoted to track admin' });
};

/**
 * DELETE /api/tracks/:id/members/:targetUserId/promote
 * Demote track admin to member
 */
export const demoteFromAdmin = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    const { id, targetUserId } = req.params;
    const requesterId = req.user!._id;

    const track = await Track.findById(id);
    if (!track) {
        sendNotFound(res, 'Track not found');
        return;
    }

    const requesterOrgMembership = await OrganizationMembership.findOne({
        userId: requesterId,
        organizationId: track.organizationId,
    });

    if (!requesterOrgMembership || !['owner', 'admin'].includes(requesterOrgMembership.role)) {
        sendError(res, 'Only organization owners/admins can demote track admins', 403);
        return;
    }

    const targetMembership = await TrackMembership.findOne({
        userId: targetUserId,
        trackId: id,
    });

    if (!targetMembership) {
        sendNotFound(res, 'Member not found');
        return;
    }

    targetMembership.role = 'member';
    await targetMembership.save();

    sendSuccess(res, { message: 'Member demoted from track admin' });
};
