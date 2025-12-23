import mongoose, { Schema } from 'mongoose';
import { ISubmission } from '../types';

const submissionSchema = new Schema<ISubmission>(
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
        weekStart: {
            type: Date,
            required: true,
        },
        weekEnd: {
            type: Date,
            required: true,
        },
        description: {
            type: String,
            required: true,
            trim: true,
            minlength: 10,
            maxlength: 2000,
        },
        proofUrl: {
            type: String,
            required: true,
        },
        proofType: {
            type: String,
            enum: ['image', 'file', 'link'],
            required: true,
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
        },
        score: {
            type: Number,
            min: 0,
        },
        verifiedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        verifiedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index to enforce one submission per user per track per week
submissionSchema.index(
    { userId: 1, trackId: 1, weekStart: 1 },
    { unique: true }
);

// Index for finding submissions by track and week (for leaderboard)
submissionSchema.index({ trackId: 1, weekStart: 1, status: 1 });

// Index for finding pending submissions
submissionSchema.index({ trackId: 1, status: 1 });

export const Submission = mongoose.model<ISubmission>(
    'Submission',
    submissionSchema
);
