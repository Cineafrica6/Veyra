import mongoose, { Schema } from 'mongoose';
import { IOrganization } from '../types';

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
    },
    {
        timestamps: true,
    }
);

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
