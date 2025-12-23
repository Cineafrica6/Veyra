import mongoose, { Schema } from 'mongoose';
import { IOrganization } from '../types';
import { generateInviteCode } from '../utils';

const organizationSchema = new Schema<IOrganization>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 100,
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        description: {
            type: String,
            trim: true,
            maxlength: 500,
        },
        ownerId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        sudoPasswordHash: {
            type: String,
            select: false, // Don't include in queries by default
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
    },
    {
        timestamps: true,
    }
);

// Generate invite code before saving if not present
organizationSchema.pre('save', function (next) {
    if (!this.inviteCode) {
        this.inviteCode = generateInviteCode();
    }
    next();
});

// Helper to generate slug from name
organizationSchema.statics.generateSlug = function (name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
};

export const Organization = mongoose.model<IOrganization>(
    'Organization',
    organizationSchema
);
