import { Types } from 'mongoose';
import { Submission, TrackMembership } from '../models';
import { LeaderboardEntry, WeekBoundaries } from '../types';
import { getStreakMultiplier } from '../utils';

/**
 * Get the leaderboard for a track for a specific week
 * Uses MongoDB aggregation pipeline for efficient computation
 * Includes streak multipliers in score calculation
 */
export const getWeeklyLeaderboard = async (
    trackId: Types.ObjectId | string,
    weekBoundaries: WeekBoundaries
): Promise<LeaderboardEntry[]> => {
    const pipeline = [
        // Stage 1: Match approved submissions for this track and week
        {
            $match: {
                trackId: new Types.ObjectId(trackId),
                weekStart: weekBoundaries.start,
                status: 'approved',
            },
        },
        // Stage 2: Group by userId and sum scores
        {
            $group: {
                _id: '$userId',
                baseScore: { $sum: '$score' },
                submissionCount: { $sum: 1 },
            },
        },
        // Stage 3: Lookup user details
        {
            $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'user',
            },
        },
        // Stage 4: Lookup track membership for streak info
        {
            $lookup: {
                from: 'trackmemberships',
                let: { userId: '$_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$userId', '$$userId'] },
                                    { $eq: ['$trackId', new Types.ObjectId(trackId)] },
                                ],
                            },
                        },
                    },
                ],
                as: 'membership',
            },
        },
        // Stage 5: Unwind arrays
        {
            $unwind: '$user',
        },
        {
            $unwind: { path: '$membership', preserveNullAndEmptyArrays: true },
        },
        // Stage 6: Project final shape with streak info
        {
            $project: {
                _id: 0,
                userId: '$_id',
                displayName: {
                    $ifNull: ['$user.displayName', '$user.email'],
                },
                avatarUrl: '$user.avatarUrl',
                baseScore: 1,
                submissionCount: 1,
                currentStreak: { $ifNull: ['$membership.currentStreak', 0] },
                longestStreak: { $ifNull: ['$membership.longestStreak', 0] },
            },
        },
    ];

    const results = await Submission.aggregate(pipeline);

    // Apply streak multiplier and calculate final score, then sort and add rank
    const leaderboardWithMultipliers = results.map((entry) => {
        const streakMultiplier = getStreakMultiplier(entry.currentStreak);
        const totalScore = Math.round(entry.baseScore * streakMultiplier * 100) / 100;
        return {
            userId: entry.userId,
            userName: entry.displayName, // Map to userName for frontend
            avatarUrl: entry.avatarUrl,
            baseScore: entry.baseScore,
            submissionCount: entry.submissionCount,
            currentStreak: entry.currentStreak,
            longestStreak: entry.longestStreak,
            streakMultiplier, // Frontend expects this name
            totalScore,
        };
    });

    // Sort by total score descending
    leaderboardWithMultipliers.sort((a, b) => b.totalScore - a.totalScore);

    // Add rank to each entry
    return leaderboardWithMultipliers.map((entry, index) => ({
        ...entry,
        rank: index + 1,
    }));
};

/**
 * Get a user's rank in the leaderboard
 */
export const getUserRank = async (
    trackId: Types.ObjectId | string,
    userId: Types.ObjectId | string,
    weekBoundaries: WeekBoundaries
): Promise<number | null> => {
    const leaderboard = await getWeeklyLeaderboard(trackId, weekBoundaries);
    const entry = leaderboard.find(
        (e) => e.userId.toString() === userId.toString()
    );
    return entry?.rank || null;
};

/**
 * Get leaderboard statistics for a track
 */
export const getLeaderboardStats = async (
    trackId: Types.ObjectId | string,
    weekBoundaries: WeekBoundaries
): Promise<{
    totalParticipants: number;
    totalSubmissions: number;
    averageScore: number;
}> => {
    const pipeline = [
        {
            $match: {
                trackId: new Types.ObjectId(trackId),
                weekStart: weekBoundaries.start,
                status: 'approved',
            },
        },
        {
            $group: {
                _id: null,
                totalParticipants: { $addToSet: '$userId' },
                totalSubmissions: { $sum: 1 },
                totalScore: { $sum: '$score' },
            },
        },
        {
            $project: {
                _id: 0,
                totalParticipants: { $size: '$totalParticipants' },
                totalSubmissions: 1,
                averageScore: {
                    $cond: [
                        { $gt: ['$totalSubmissions', 0] },
                        { $divide: ['$totalScore', '$totalSubmissions'] },
                        0,
                    ],
                },
            },
        },
    ];

    const results = await Submission.aggregate(pipeline);

    if (results.length === 0) {
        return {
            totalParticipants: 0,
            totalSubmissions: 0,
            averageScore: 0,
        };
    }

    return results[0];
};
