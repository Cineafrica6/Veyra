import mongoose, { Schema } from 'mongoose';
import { IOrganizationMembership } from '../types';

const organizationMembershipSchema = new Schema<IOrganizationMembership>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        organizationId: {
            type: Schema.Types.ObjectId,
            ref: 'Organization',
            required: true,
        },
        role: {
            type: String,
            enum: ['owner', 'admin', 'member'],
            default: 'member',
            required: true,
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

// Compound index to ensure one membership per user per organization
organizationMembershipSchema.index(
    { userId: 1, organizationId: 1 },
    { unique: true }
);

// Index for finding all members of an organization
organizationMembershipSchema.index({ organizationId: 1 });

// Index for finding all organizations of a user
organizationMembershipSchema.index({ userId: 1 });

export const OrganizationMembership = mongoose.model<IOrganizationMembership>(
    'OrganizationMembership',
    organizationMembershipSchema
);
