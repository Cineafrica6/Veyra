import { Response } from 'express';
import { Track } from '../models';
import { AuthenticatedRequest } from '../types';
import { sendSuccess, sendNotFound } from '../utils';
import {
    getWeeklyLeaderboard,
    getLeaderboardStats,
    getCurrentWeekBoundaries,
    getWeekBoundaries,
    formatWeekRange,
} from '../services';

/**
 * GET /api/tracks/:trackId/leaderboard
 * Get weekly leaderboard for a track
 */
export const getLeaderboard = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    const { trackId } = req.params;
    const { week } = req.query; // Optional: 'current', 'previous', or ISO date

    const track = await Track.findById(trackId);
    if (!track) {
        sendNotFound(res, 'Track not found');
        return;
    }

    // Determine week boundaries
    let weekBoundaries;
    if (!week || week === 'current') {
        weekBoundaries = getCurrentWeekBoundaries(track.weekStartDay);
    } else if (week === 'previous') {
        const now = new Date();
        now.setDate(now.getDate() - 7);
        weekBoundaries = getWeekBoundaries(now, track.weekStartDay);
    } else {
        weekBoundaries = getWeekBoundaries(
            new Date(week as string),
            track.weekStartDay
        );
    }

    // Get leaderboard and stats
    const [leaderboard, stats] = await Promise.all([
        getWeeklyLeaderboard(trackId, weekBoundaries),
        getLeaderboardStats(trackId, weekBoundaries),
    ]);

    sendSuccess(res, {
        weekStart: weekBoundaries.start,
        weekEnd: weekBoundaries.end,
        weekRange: formatWeekRange(weekBoundaries.start, weekBoundaries.end),
        stats: {
            totalParticipants: stats.totalParticipants,
            totalSubmissions: stats.totalSubmissions,
            averageScore: Math.round(stats.averageScore * 100) / 100,
        },
        leaderboard,
    });
};

/**
 * GET /api/tracks/:trackId/leaderboard/my-rank
 * Get current user's rank in the leaderboard
 */
export const getMyRank = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    const { trackId } = req.params;
    const userId = req.user!._id;

    const track = await Track.findById(trackId);
    if (!track) {
        sendNotFound(res, 'Track not found');
        return;
    }

    const weekBoundaries = getCurrentWeekBoundaries(track.weekStartDay);
    const leaderboard = await getWeeklyLeaderboard(trackId, weekBoundaries);

    const myEntry = leaderboard.find(
        (e) => e.userId.toString() === userId.toString()
    );

    sendSuccess(res, {
        weekStart: weekBoundaries.start,
        weekEnd: weekBoundaries.end,
        rank: myEntry?.rank || null,
        totalScore: myEntry?.totalScore || 0,
        totalParticipants: leaderboard.length,
    });
};
