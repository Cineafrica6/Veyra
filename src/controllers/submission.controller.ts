import { Response } from 'express';
import { Submission, Track, OrganizationMembership, TrackMembership } from '../models';
import { AuthenticatedRequest } from '../types';
import { sendSuccess, sendCreated, sendError, sendNotFound, getWeekBoundaries as getWeekBoundariesUtil, isPreviousWeek } from '../utils';
import { getCurrentWeekBoundaries, getWeekBoundaries } from '../services';

/**
 * POST /api/tracks/:trackId/submissions
 * Submit weekly progress (one per week per user per track)
 */
export const createSubmission = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    const { trackId } = req.params;
    const { description, proofUrl, proofType } = req.body;
    const userId = req.user!._id;

    // Validate inputs
    if (!description || description.trim().length < 10) {
        sendError(res, 'Description must be at least 10 characters');
        return;
    }

    if (!proofUrl) {
        sendError(res, 'Proof URL is required');
        return;
    }

    if (!['image', 'file', 'link'].includes(proofType)) {
        sendError(res, 'Invalid proof type. Must be image, file, or link');
        return;
    }

    // Get track to determine week boundaries
    const track = await Track.findById(trackId);
    if (!track) {
        sendNotFound(res, 'Track not found');
        return;
    }

    // Get current week boundaries
    const { start: weekStart, end: weekEnd } = getCurrentWeekBoundaries(
        track.weekStartDay
    );

    // Check if user already submitted this week
    const existingSubmission = await Submission.findOne({
        userId,
        trackId,
        weekStart,
    });

    if (existingSubmission) {
        sendError(res, 'You have already submitted for this week', 409);
        return;
    }

    // Create submission
    const submission = await Submission.create({
        userId,
        trackId,
        weekStart,
        weekEnd,
        description: description.trim(),
        proofUrl,
        proofType,
        status: 'pending',
    });

    sendCreated(res, {
        id: submission._id,
        weekStart: submission.weekStart,
        weekEnd: submission.weekEnd,
        description: submission.description,
        proofUrl: submission.proofUrl,
        proofType: submission.proofType,
        status: submission.status,
        createdAt: submission.createdAt,
    });
};

/**
 * GET /api/tracks/:trackId/submissions
 * List submissions for a track
 * - Members see only their own
 * - Admins see all
 */
export const listSubmissions = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    const { trackId } = req.params;
    const { week } = req.query; // Optional: 'current', 'previous', or ISO date
    const userId = req.user!._id;

    // Get track
    const track = await Track.findById(trackId);
    if (!track) {
        sendNotFound(res, 'Track not found');
        return;
    }

    // Check if user is admin
    const orgMembership = await OrganizationMembership.findOne({
        userId,
        organizationId: track.organizationId,
    });

    const isAdmin =
        orgMembership?.role === 'owner' || orgMembership?.role === 'admin';

    // Build query
    const query: any = { trackId };

    // If not admin, only show own submissions
    if (!isAdmin) {
        query.userId = userId;
    }

    // Filter by week if specified
    if (week) {
        let weekBoundaries;
        if (week === 'current') {
            weekBoundaries = getCurrentWeekBoundaries(track.weekStartDay);
        } else if (week === 'previous') {
            const now = new Date();
            now.setDate(now.getDate() - 7);
            weekBoundaries = getWeekBoundaries(now, track.weekStartDay);
        } else {
            // Assume ISO date
            weekBoundaries = getWeekBoundaries(
                new Date(week as string),
                track.weekStartDay
            );
        }
        query.weekStart = weekBoundaries.start;
    }

    const submissions = await Submission.find(query)
        .populate('userId', 'email displayName avatarUrl')
        .populate('verifiedBy', 'email displayName')
        .sort({ createdAt: -1 })
        .lean();

    const result = submissions.map((s: any) => ({
        id: s._id,
        user: {
            id: s.userId._id,
            email: s.userId.email,
            displayName: s.userId.displayName,
            avatarUrl: s.userId.avatarUrl,
        },
        weekStart: s.weekStart,
        weekEnd: s.weekEnd,
        description: s.description,
        proofUrl: s.proofUrl,
        proofType: s.proofType,
        status: s.status,
        score: s.score,
        verifiedBy: s.verifiedBy
            ? {
                id: s.verifiedBy._id,
                displayName: s.verifiedBy.displayName,
            }
            : null,
        verifiedAt: s.verifiedAt,
        createdAt: s.createdAt,
    }));

    sendSuccess(res, result);
};

/**
 * GET /api/tracks/:trackId/submissions/pending
 * Get pending submissions (admin only)
 */
export const getPendingSubmissions = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    const { trackId } = req.params;

    const submissions = await Submission.find({
        trackId,
        status: 'pending',
    })
        .populate('userId', 'email displayName avatarUrl')
        .sort({ createdAt: 1 })
        .lean();

    const result = submissions.map((s: any) => ({
        id: s._id,
        user: {
            id: s.userId._id,
            email: s.userId.email,
            displayName: s.userId.displayName,
            avatarUrl: s.userId.avatarUrl,
        },
        weekStart: s.weekStart,
        weekEnd: s.weekEnd,
        description: s.description,
        proofUrl: s.proofUrl,
        proofType: s.proofType,
        createdAt: s.createdAt,
    }));

    sendSuccess(res, result);
};

/**
 * GET /api/submissions/:id
 * Get submission details
 */
export const getSubmission = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    const { id } = req.params;
    const userId = req.user!._id;

    const submission = await Submission.findById(id)
        .populate('userId', 'email displayName avatarUrl')
        .populate('verifiedBy', 'email displayName')
        .lean() as any;

    if (!submission) {
        sendNotFound(res, 'Submission not found');
        return;
    }

    // Check access - must be owner or org admin
    const track = await Track.findById(submission.trackId);
    if (!track) {
        sendNotFound(res, 'Track not found');
        return;
    }

    const orgMembership = await OrganizationMembership.findOne({
        userId,
        organizationId: track.organizationId,
    });

    const isAdmin =
        orgMembership?.role === 'owner' || orgMembership?.role === 'admin';
    const isOwner = submission.userId._id.toString() === userId.toString();

    if (!isAdmin && !isOwner) {
        sendError(res, 'Access denied', 403);
        return;
    }

    sendSuccess(res, {
        id: submission._id,
        user: {
            id: submission.userId._id,
            email: submission.userId.email,
            displayName: submission.userId.displayName,
            avatarUrl: submission.userId.avatarUrl,
        },
        weekStart: submission.weekStart,
        weekEnd: submission.weekEnd,
        description: submission.description,
        proofUrl: submission.proofUrl,
        proofType: submission.proofType,
        status: submission.status,
        score: submission.score,
        verifiedBy: submission.verifiedBy
            ? {
                id: submission.verifiedBy._id,
                displayName: submission.verifiedBy.displayName,
            }
            : null,
        verifiedAt: submission.verifiedAt,
        createdAt: submission.createdAt,
    });
};

/**
 * POST /api/submissions/:id/verify
 * Verify (approve/reject) a submission (admin only)
 */
export const verifySubmission = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    const { id } = req.params;
    const { status, score } = req.body;
    const verifierId = req.user!._id;

    if (!['approved', 'rejected'].includes(status)) {
        sendError(res, 'Status must be approved or rejected');
        return;
    }

    const submission = await Submission.findById(id);
    if (!submission) {
        sendNotFound(res, 'Submission not found');
        return;
    }

    // Get track to validate score range
    const track = await Track.findById(submission.trackId);
    if (!track) {
        sendNotFound(res, 'Track not found');
        return;
    }

    // If approving, score is required
    if (status === 'approved') {
        if (score === undefined || score === null) {
            sendError(res, 'Score is required when approving');
            return;
        }

        if (score < track.minScore || score > track.maxScore) {
            sendError(
                res,
                `Score must be between ${track.minScore} and ${track.maxScore}`
            );
            return;
        }

        submission.score = score;

        // Update streak for the user
        const membership = await TrackMembership.findOne({
            userId: submission.userId,
            trackId: submission.trackId,
        });

        if (membership) {
            const { weekStart: currentWeekStart } = getWeekBoundariesUtil(
                submission.weekStart,
                track.weekStartDay
            );

            // Check if this is consecutive to last submission
            if (isPreviousWeek(membership.lastSubmissionWeek, currentWeekStart, track.weekStartDay)) {
                // Continue streak
                membership.currentStreak += 1;
            } else if (!membership.lastSubmissionWeek ||
                membership.lastSubmissionWeek.getTime() !== currentWeekStart.getTime()) {
                // Reset streak (not consecutive and not same week)
                membership.currentStreak = 1;
            }
            // If same week, don't change streak

            // Update longest streak
            if (membership.currentStreak > membership.longestStreak) {
                membership.longestStreak = membership.currentStreak;
            }

            // Update last submission week
            membership.lastSubmissionWeek = currentWeekStart;
            await membership.save();
        }
    }

    submission.status = status;
    submission.verifiedBy = verifierId;
    submission.verifiedAt = new Date();

    await submission.save();

    sendSuccess(res, {
        id: submission._id,
        status: submission.status,
        score: submission.score,
        verifiedAt: submission.verifiedAt,
    });
};
