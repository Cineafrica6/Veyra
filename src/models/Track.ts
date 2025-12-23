import mongoose, { Schema } from 'mongoose';
import { ITrack } from '../types';
import { generateInviteCode } from '../utils';

const trackSchema = new Schema<ITrack>(
    {
        organizationId: {
            type: Schema.Types.ObjectId,
            ref: 'Organization',
            required: true,
            index: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 100,
        },
        description: {
            type: String,
            trim: true,
            maxlength: 500,
        },
        weekStartDay: {
            type: Number,
            enum: [0, 1, 2, 3, 4, 5, 6], // 0=Sunday, 1=Monday, etc.
            default: 1, // Monday
            required: true,
        },
        minScore: {
            type: Number,
            default: 0,
            min: 0,
        },
        maxScore: {
            type: Number,
            default: 10,
            min: 1,
        },
        inviteCode: {
            type: String,
            unique: true,
            index: true,
        },
        inviteEnabled: {
            type: Boolean,
            default: true,
        },
        maxMembers: {
            type: Number,
            min: 1,
        },
        memberCount: {
            type: Number,
            default: 0,
            min: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Generate invite code before saving if not present
trackSchema.pre('save', function (next) {
    if (!this.inviteCode) {
        this.inviteCode = generateInviteCode();
    }
    next();
});

// Validation: maxScore must be greater than minScore
trackSchema.pre('save', function (next) {
    if (this.maxScore <= this.minScore) {
        next(new Error('maxScore must be greater than minScore'));
    } else {
        next();
    }
});

export const Track = mongoose.model<ITrack>('Track', trackSchema);
