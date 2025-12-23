import mongoose, { Schema } from 'mongoose';
import { Document, Types } from 'mongoose';

export interface IQuiz extends Document {
    _id: Types.ObjectId;
    trackId: Types.ObjectId;
    question: string;
    weekStart: Date;
    weekEnd: Date;
    createdBy: Types.ObjectId;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const quizSchema = new Schema<IQuiz>(
    {
        trackId: {
            type: Schema.Types.ObjectId,
            ref: 'Track',
            required: true,
            index: true,
        },
        question: {
            type: String,
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
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Index for finding quizzes by track and week
quizSchema.index({ trackId: 1, weekStart: 1 });

export const Quiz = mongoose.model<IQuiz>('Quiz', quizSchema);
