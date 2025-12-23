import { Request } from 'express';
import { Document, Types } from 'mongoose';

// User types
export interface IUser extends Document {
    _id: Types.ObjectId;
    clerkId: string;
    email: string;
    displayName?: string;
    avatarUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}

// Organization types
export interface IOrganization extends Document {
    _id: Types.ObjectId;
    name: string;
    slug: string;
    description?: string;
    ownerId: Types.ObjectId;
    sudoPasswordHash?: string;
    inviteCode: string;
    inviteEnabled: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// Organization membership types
export type OrgRole = 'owner' | 'admin' | 'member';

export interface IOrganizationMembership extends Document {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    organizationId: Types.ObjectId;
    role: OrgRole;
    joinedAt: Date;
}

// Track types
export type WeekDay = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Sunday, 1=Monday, etc.

export interface ITrack extends Document {
    _id: Types.ObjectId;
    organizationId: Types.ObjectId;
    name: string;
    description?: string;
    weekStartDay: WeekDay;
    minScore: number;
    maxScore: number;
    inviteCode: string;
    inviteEnabled: boolean;
    maxMembers?: number;
    memberCount: number;
    createdAt: Date;
    updatedAt: Date;
}

// Track membership types
export type TrackRole = 'admin' | 'member';
export type MemberStatus = 'active' | 'suspended' | 'banned';

export interface ITrackMembership extends Document {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    trackId: Types.ObjectId;
    role: TrackRole;
    status: MemberStatus;
    suspendedAt?: Date;
    suspendedUntil?: Date;
    bannedAt?: Date;
    currentStreak: number;
    longestStreak: number;
    lastSubmissionDate?: Date;
    joinedAt: Date;
}

// Submission types
export type ProofType = 'image' | 'file' | 'link';
export type SubmissionStatus = 'pending' | 'approved' | 'rejected';

export interface ISubmission extends Document {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    trackId: Types.ObjectId;
    weekStart: Date;
    weekEnd: Date;
    description: string;
    proofUrl: string;
    proofType: ProofType;
    status: SubmissionStatus;
    score?: number;
    verifiedBy?: Types.ObjectId;
    verifiedAt?: Date;
    createdAt: Date;
}

// Extended Request with authenticated user
export interface AuthenticatedRequest extends Request {
    user?: IUser;
    orgMembership?: IOrganizationMembership;
    trackMembership?: ITrackMembership;
}

// Week boundaries type
export interface WeekBoundaries {
    start: Date;
    end: Date;
}

// Leaderboard entry type
export interface LeaderboardEntry {
    rank: number;
    userId: Types.ObjectId;
    displayName: string;
    avatarUrl?: string;
    totalScore: number;
    submissionCount: number;
}

// Daily Check-In types
export interface IDailyCheckIn extends Document {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    trackId: Types.ObjectId;
    organizationId: Types.ObjectId;
    date: Date; // Normalized to midnight UTC
    note?: string;
    createdAt: Date;
}
