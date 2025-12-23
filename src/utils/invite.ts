import { customAlphabet } from 'nanoid';

// Create a custom alphabet without ambiguous characters
const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const generateCode = customAlphabet(alphabet, 8);

export const generateInviteCode = (): string => {
    return generateCode();
};

export const formatInviteLink = (baseUrl: string, code: string): string => {
    return `${baseUrl}/join/${code}`;
};
