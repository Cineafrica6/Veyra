import { Response } from 'express';
import { Quiz, QuizResponse, Track, TrackMembership, OrganizationMembership } from '../models';
import { AuthenticatedRequest } from '../types';
import {
    sendSuccess,
    sendCreated,
    sendError,
    sendNotFound,
    sendForbidden,
    getWeekBoundaries,
} from '../utils';

/**
 * Check if user is track or org admin
 */
async function isTrackAdmin(userId: string, trackId: string): Promise<boolean> {
    const track = await Track.findById(trackId);
    if (!track) return false;

    const trackMembership = await TrackMembership.findOne({ userId, trackId });
    if (trackMembership?.role === 'admin') return true;

    const orgMembership = await OrganizationMembership.findOne({
        userId,
        organizationId: track.organizationId,
    });
    return orgMembership?.role === 'owner' || orgMembership?.role === 'admin';
}

/**
 * POST /api/tracks/:id/quizzes
 * Create a quiz for current week (admin only)
 */
export const createQuiz = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    const { id: trackId } = req.params;
    const { question } = req.body;
    const userId = req.user!._id;

    if (!question || question.trim().length < 10) {
        sendError(res, 'Question must be at least 10 characters');
        return;
    }

    const track = await Track.findById(trackId);
    if (!track) {
        sendNotFound(res, 'Track not found');
        return;
    }

    // Check admin permissions
    if (!(await isTrackAdmin(userId.toString(), trackId))) {
        sendForbidden(res, 'Only admins can create quizzes');
        return;
    }

    // Get current week boundaries
    const { weekStart, weekEnd } = getWeekBoundaries(new Date(), track.weekStartDay);

    // Check if quiz already exists for this week
    const existingQuiz = await Quiz.findOne({
        trackId,
        weekStart,
    });

    if (existingQuiz) {
        sendError(res, 'A quiz already exists for this week', 409);
        return;
    }

    const quiz = await Quiz.create({
        trackId,
        question: question.trim(),
        weekStart,
        weekEnd,
        createdBy: userId,
        isActive: true,
    });

    sendCreated(res, {
        id: quiz._id,
        question: quiz.question,
        weekStart: quiz.weekStart,
        weekEnd: quiz.weekEnd,
        isActive: quiz.isActive,
    });
};

/**
 * GET /api/tracks/:id/quizzes/current
 * Get current week's quiz
 */
export const getCurrentQuiz = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    const { id: trackId } = req.params;
    const userId = req.user!._id;

    const track = await Track.findById(trackId);
    if (!track) {
        sendNotFound(res, 'Track not found');
        return;
    }

    const { weekStart } = getWeekBoundaries(new Date(), track.weekStartDay);

    const quiz = await Quiz.findOne({
        trackId,
        weekStart,
        isActive: true,
    });

    if (!quiz) {
        sendSuccess(res, null);
        return;
    }

    // Check if user already answered
    const existingResponse = await QuizResponse.findOne({
        quizId: quiz._id,
        userId,
    });

    sendSuccess(res, {
        id: quiz._id,
        question: quiz.question,
        weekStart: quiz.weekStart,
        weekEnd: quiz.weekEnd,
        hasAnswered: !!existingResponse,
        myScore: existingResponse?.score,
    });
};

/**
 * POST /api/quizzes/:quizId/respond
 * Submit an answer to a quiz
 */
export const submitQuizResponse = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    const { quizId } = req.params;
    const { answer } = req.body;
    const userId = req.user!._id;

    if (!answer || answer.trim().length < 1) {
        sendError(res, 'Answer is required');
        return;
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
        sendNotFound(res, 'Quiz not found');
        return;
    }

    if (!quiz.isActive) {
        sendError(res, 'This quiz is no longer active');
        return;
    }

    // Check if user is a track member
    const membership = await TrackMembership.findOne({
        userId,
        trackId: quiz.trackId,
    });

    if (!membership) {
        sendForbidden(res, 'You must be a track member to answer');
        return;
    }

    if (membership.isBanned) {
        sendForbidden(res, 'You are banned from this track');
        return;
    }

    // Check if already answered
    const existingResponse = await QuizResponse.findOne({
        quizId,
        userId,
    });

    if (existingResponse) {
        sendError(res, 'You have already answered this quiz', 409);
        return;
    }

    const response = await QuizResponse.create({
        quizId,
        userId,
        answer: answer.trim(),
    });

    sendCreated(res, {
        id: response._id,
        answer: response.answer,
        submittedAt: response.submittedAt,
    });
};

/**
 * GET /api/quizzes/:quizId/responses
 * Get all responses to a quiz (admin only)
 */
export const getQuizResponses = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    const { quizId } = req.params;
    const userId = req.user!._id;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
        sendNotFound(res, 'Quiz not found');
        return;
    }

    // Check admin permissions
    if (!(await isTrackAdmin(userId.toString(), quiz.trackId.toString()))) {
        sendForbidden(res, 'Only admins can view responses');
        return;
    }

    const responses = await QuizResponse.find({ quizId })
        .populate('userId', 'email displayName')
        .lean();

    const result = responses.map((r: any) => ({
        id: r._id,
        userId: r.userId._id,
        email: r.userId.email,
        displayName: r.userId.displayName,
        answer: r.answer,
        score: r.score,
        scoredAt: r.scoredAt,
        submittedAt: r.submittedAt,
    }));

    sendSuccess(res, result);
};

/**
 * POST /api/quiz-responses/:responseId/score
 * Score a quiz response (admin only)
 */
export const scoreQuizResponse = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    const { responseId } = req.params;
    const { score } = req.body;
    const userId = req.user!._id;

    if (typeof score !== 'number' || score < 0) {
        sendError(res, 'Score must be a non-negative number');
        return;
    }

    const response = await QuizResponse.findById(responseId);
    if (!response) {
        sendNotFound(res, 'Response not found');
        return;
    }

    const quiz = await Quiz.findById(response.quizId);
    if (!quiz) {
        sendNotFound(res, 'Quiz not found');
        return;
    }

    // Check admin permissions
    if (!(await isTrackAdmin(userId.toString(), quiz.trackId.toString()))) {
        sendForbidden(res, 'Only admins can score responses');
        return;
    }

    response.score = score;
    response.scoredBy = userId;
    response.scoredAt = new Date();
    await response.save();

    sendSuccess(res, {
        id: response._id,
        score: response.score,
        scoredAt: response.scoredAt,
    });
};

/**
 * GET /api/tracks/:id/quizzes
 * List all quizzes for a track (admin only)
 */
export const listQuizzes = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    const { id: trackId } = req.params;
    const userId = req.user!._id;

    // Check admin permissions
    if (!(await isTrackAdmin(userId.toString(), trackId))) {
        sendForbidden(res, 'Only admins can list all quizzes');
        return;
    }

    const quizzes = await Quiz.find({ trackId })
        .sort({ weekStart: -1 })
        .lean();

    const result = quizzes.map((q: any) => ({
        id: q._id,
        question: q.question,
        weekStart: q.weekStart,
        weekEnd: q.weekEnd,
        isActive: q.isActive,
        createdAt: q.createdAt,
    }));

    sendSuccess(res, result);
};
