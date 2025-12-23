import mongoose, { Schema } from 'mongoose';
import { ITrackMembership } from '../types';

const trackMembershipSchema = new Schema<ITrackMembership>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        trackId: {
            type: Schema.Types.ObjectId,
            ref: 'Track',
            required: true,
        },
        role: {
            type: String,
            enum: ['admin', 'member'],
            default: 'member',
        },
        isBanned: {
            type: Boolean,
            default: false,
        },
        bannedAt: {
            type: Date,
        },
        // Streak tracking
        currentStreak: {
            type: Number,
            default: 0,
        },
        longestStreak: {
            type: Number,
            default: 0,
        },
        lastSubmissionWeek: {
            type: Date, // Start of the last week they submitted
        },
        joinedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: false,
    }
);

// Compound index to ensure one membership per user per track
trackMembershipSchema.index({ userId: 1, trackId: 1 }, { unique: true });

// Index for finding all members of a track
trackMembershipSchema.index({ trackId: 1 });

// Index for finding all tracks of a user
trackMembershipSchema.index({ userId: 1 });

export const TrackMembership = mongoose.model<ITrackMembership>(
    'TrackMembership',
    trackMembershipSchema
);
