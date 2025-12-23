import mongoose, { Schema } from 'mongoose';
import { Document, Types } from 'mongoose';

export interface IQuizResponse extends Document {
    _id: Types.ObjectId;
    quizId: Types.ObjectId;
    userId: Types.ObjectId;
    answer: string;
    score?: number;
    scoredBy?: Types.ObjectId;
    scoredAt?: Date;
    submittedAt: Date;
}

const quizResponseSchema = new Schema<IQuizResponse>(
    {
        quizId: {
            type: Schema.Types.ObjectId,
            ref: 'Quiz',
            required: true,
            index: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        answer: {
            type: String,
            required: true,
        },
        score: {
            type: Number,
        },
        scoredBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        scoredAt: {
            type: Date,
        },
        submittedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: false,
    }
);

// Ensure one response per user per quiz
quizResponseSchema.index({ quizId: 1, userId: 1 }, { unique: true });

export const QuizResponse = mongoose.model<IQuizResponse>('QuizResponse', quizResponseSchema);
