import mongoose, { Schema } from 'mongoose';
import { IDailyCheckIn } from '../types';

const dailyCheckInSchema = new Schema<IDailyCheckIn>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        trackId: {
            type: Schema.Types.ObjectId,
            ref: 'Track',
            required: true,
            index: true,
        },
        organizationId: {
            type: Schema.Types.ObjectId,
            ref: 'Organization',
            required: true,
            index: true,
        },
        date: {
            type: Date,
            required: true,
        },
        note: {
            type: String,
            maxlength: 140,
            trim: true,
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    }
);

// Compound index to ensure one check-in per user per track per day
dailyCheckInSchema.index(
    { userId: 1, trackId: 1, date: 1 },
    { unique: true }
);

export const DailyCheckIn = mongoose.model<IDailyCheckIn>(
    'DailyCheckIn',
    dailyCheckInSchema
);
