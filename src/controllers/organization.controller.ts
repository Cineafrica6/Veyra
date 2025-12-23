import { Response } from 'express';
import { Organization, OrganizationMembership, User } from '../models';
import { AuthenticatedRequest, OrgRole } from '../types';
import {
    sendSuccess,
    sendCreated,
    sendError,
    sendNotFound,
    sendForbidden,
    ValidationError,
} from '../utils';

/**
 * POST /api/organizations
 * Create a new organization
 */
export const createOrganization = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    const { name } = req.body;
    const userId = req.user!._id;

    if (!name || name.trim().length < 2) {
        sendError(res, 'Organization name must be at least 2 characters');
        return;
    }

    // Generate slug
    const baseSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    // Ensure unique slug
    let slug = baseSlug;
    let counter = 1;
    while (await Organization.findOne({ slug })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
    }

    // Create organization
    const organization = await Organization.create({
        name: name.trim(),
        slug,
        ownerId: userId,
    });

    // Create owner membership
    await OrganizationMembership.create({
        userId,
        organizationId: organization._id,
        role: 'owner',
    });

    sendCreated(res, {
        id: organization._id,
        name: organization.name,
        slug: organization.slug,
        role: 'owner',
    });
};

/**
 * GET /api/organizations
 * List all organizations the user belongs to
 */
export const listOrganizations = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    const userId = req.user!._id;

    const memberships = await OrganizationMembership.find({ userId })
        .populate('organizationId')
        .lean();

    const organizations = memberships.map((m: any) => ({
        id: m.organizationId._id,
        name: m.organizationId.name,
        slug: m.organizationId.slug,
        role: m.role,
        joinedAt: m.joinedAt,
    }));

    sendSuccess(res, organizations);
};

/**
 * GET /api/organizations/:id
 * Get organization details
 */
export const getOrganization = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    const { id } = req.params;

    const organization = await Organization.findById(id);
    if (!organization) {
        sendNotFound(res, 'Organization not found');
        return;
    }

    const membership = req.orgMembership;
    //const membershipRole = membership?.role;

    sendSuccess(res, {
        id: organization._id,
        name: organization.name,
        slug: organization.slug,
        role: membership?.role,
        createdAt: organization.createdAt,
    });
};

/**
 * PATCH /api/organizations/:id
 * Update organization (owner/admin only)
 */
export const updateOrganization = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    const { id } = req.params;
    const { name } = req.body;

    const organization = await Organization.findById(id);
    if (!organization) {
        sendNotFound(res, 'Organization not found');
        return;
    }

    if (name) {
        organization.name = name.trim();
    }

    await organization.save();

    sendSuccess(res, {
        id: organization._id,
        name: organization.name,
        slug: organization.slug,
    });
};

/**
 * GET /api/organizations/:id/members
 * List organization members
 */
export const listMembers = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    const { id } = req.params;

    const memberships = await OrganizationMembership.find({ organizationId: id })
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
 * POST /api/organizations/:id/members
 * Add member by email (owner/admin only)
 */
export const addMember = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    const { id } = req.params;
    const { email, role = 'member' } = req.body;

    if (!email) {
        sendError(res, 'Email is required');
        return;
    }

    // Only owner can add admins
    if (role === 'admin' && req.orgMembership?.role !== 'owner') {
        sendForbidden(res, 'Only owners can add admins');
        return;
    }

    // Cannot add owners
    if (role === 'owner') {
        sendError(res, 'Cannot add owner role');
        return;
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
        sendNotFound(res, 'User not found with this email');
        return;
    }

    // Check if already a member
    const existing = await OrganizationMembership.findOne({
        userId: user._id,
        organizationId: id,
    });

    if (existing) {
        sendError(res, 'User is already a member of this organization', 409);
        return;
    }

    // Create membership
    const membership = await OrganizationMembership.create({
        userId: user._id,
        organizationId: id,
        role,
    });

    sendCreated(res, {
        userId: user._id,
        email: user.email,
        displayName: user.displayName,
        role: membership.role,
        joinedAt: membership.joinedAt,
    });
};

/**
 * PATCH /api/organizations/:id/members/:userId
 * Update member role (owner only)
 */
export const updateMemberRole = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    const { id, userId } = req.params;
    const { role } = req.body;

    if (!['admin', 'member'].includes(role)) {
        sendError(res, 'Invalid role. Must be admin or member');
        return;
    }

    // Cannot change your own role
    if (userId === req.user!._id.toString()) {
        sendError(res, 'Cannot change your own role');
        return;
    }

    const membership = await OrganizationMembership.findOne({
        userId,
        organizationId: id,
    });

    if (!membership) {
        sendNotFound(res, 'Member not found');
        return;
    }

    // Cannot change owner's role
    if (membership.role === 'owner') {
        sendError(res, 'Cannot change owner role');
        return;
    }

    membership.role = role as OrgRole;
    await membership.save();

    sendSuccess(res, {
        userId,
        role: membership.role,
    });
};

/**
 * DELETE /api/organizations/:id/members/:userId
 * Remove member (owner/admin only, but only owner can remove admins)
 */
export const removeMember = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    const { id, userId } = req.params;

    // Cannot remove yourself
    if (userId === req.user!._id.toString()) {
        sendError(res, 'Cannot remove yourself. Leave the organization instead.');
        return;
    }

    const membership = await OrganizationMembership.findOne({
        userId,
        organizationId: id,
    });

    if (!membership) {
        sendNotFound(res, 'Member not found');
        return;
    }

    // Cannot remove owner
    if (membership.role === 'owner') {
        sendError(res, 'Cannot remove the owner');
        return;
    }

    // Only owner can remove admins
    if (membership.role === 'admin' && req.orgMembership?.role !== 'owner') {
        sendForbidden(res, 'Only owners can remove admins');
        return;
    }

    await membership.deleteOne();

    sendSuccess(res, { message: 'Member removed successfully' });
};

/**
 * POST /api/organizations/:id/sudo-password
 * Set sudo password for destructive operations (owner only)
 */
export const setSudoPassword = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
        sendError(res, 'Password must be at least 6 characters');
        return;
    }

    // Only owner can set sudo password
    if (req.orgMembership?.role !== 'owner') {
        sendForbidden(res, 'Only owners can set sudo password');
        return;
    }

    const bcrypt = await import('bcrypt');
    const hash = await bcrypt.hash(password, 10);

    await Organization.findByIdAndUpdate(id, { sudoPasswordHash: hash });

    sendSuccess(res, { message: 'Sudo password set successfully' });
};

/**
 * POST /api/organizations/:id/verify-sudo
 * Verify sudo password
 */
export const verifySudoPassword = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
        sendError(res, 'Password is required');
        return;
    }

    const org = await Organization.findById(id).select('+sudoPasswordHash');
    if (!org) {
        sendNotFound(res, 'Organization not found');
        return;
    }

    if (!org.sudoPasswordHash) {
        sendError(res, 'No sudo password set. Set one first.');
        return;
    }

    const bcrypt = await import('bcrypt');
    const isValid = await bcrypt.compare(password, org.sudoPasswordHash);

    if (!isValid) {
        sendForbidden(res, 'Invalid sudo password');
        return;
    }

    sendSuccess(res, { verified: true });
};

/**
 * DELETE /api/organizations/:id
 * Delete organization (owner only, requires sudo password)
 */
export const deleteOrganization = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    const { id } = req.params;
    const { sudoPassword } = req.body;

    // Only owner can delete
    if (req.orgMembership?.role !== 'owner') {
        sendForbidden(res, 'Only owners can delete the organization');
        return;
    }

    const org = await Organization.findById(id).select('+sudoPasswordHash');
    if (!org) {
        sendNotFound(res, 'Organization not found');
        return;
    }

    // Require sudo password if set
    if (org.sudoPasswordHash) {
        if (!sudoPassword) {
            sendError(res, 'Sudo password required for this action');
            return;
        }

        const bcrypt = await import('bcrypt');
        const isValid = await bcrypt.compare(sudoPassword, org.sudoPasswordHash);

        if (!isValid) {
            sendForbidden(res, 'Invalid sudo password');
            return;
        }
    }

    // Import Track and TrackMembership
    const { Track, TrackMembership, Submission, Quiz, QuizResponse } = await import('../models');

    // Delete all related data
    const tracks = await Track.find({ organizationId: id });
    const trackIds = tracks.map(t => t._id);

    await QuizResponse.deleteMany({ quizId: { $in: await Quiz.find({ trackId: { $in: trackIds } }).distinct('_id') } });
    await Quiz.deleteMany({ trackId: { $in: trackIds } });
    await Submission.deleteMany({ trackId: { $in: trackIds } });
    await TrackMembership.deleteMany({ trackId: { $in: trackIds } });
    await Track.deleteMany({ organizationId: id });
    await OrganizationMembership.deleteMany({ organizationId: id });
    await org.deleteOne();

    sendSuccess(res, { message: 'Organization deleted successfully' });
};
