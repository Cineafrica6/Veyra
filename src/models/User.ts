import mongoose, { Schema } from 'mongoose';
import { IUser } from '../types';

const userSchema = new Schema<IUser>(
    {
        clerkId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        displayName: {
            type: String,
            trim: true,
        },
        avatarUrl: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

export const User = mongoose.model<IUser>('User', userSchema);
