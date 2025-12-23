import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { sendSuccess, sendError } from '../utils';
import cloudinary from '../config/cloudinary';

/**
 * POST /api/upload/proof
 * Upload proof to Cloudinary
 */
export const uploadProof = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    try {
        if (!req.file) {
            sendError(res, 'No file uploaded');
            return;
        }

        // Convert buffer to base64
        const base64 = req.file.buffer.toString('base64');
        const dataUri = `data:${req.file.mimetype};base64,${base64}`;

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(dataUri, {
            folder: 'veyra/proofs',
            resource_type: 'auto',
            allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'mp4', 'webm'],
            max_bytes: 10 * 1024 * 1024, // 10MB limit
        });

        // Determine proof type based on resource type
        let proofType: 'image' | 'file' = 'file';
        if (result.resource_type === 'image') {
            proofType = 'image';
        }

        sendSuccess(res, {
            url: result.secure_url,
            publicId: result.public_id,
            proofType,
            format: result.format,
            size: result.bytes,
        });
    } catch (error: any) {
        console.error('Upload error:', error);
        sendError(res, error.message || 'Upload failed', 500);
    }
};

/**
 * DELETE /api/upload/:publicId
 * Delete a file from Cloudinary
 */
export const deleteUpload = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    try {
        const { publicId } = req.params;

        await cloudinary.uploader.destroy(publicId);

        sendSuccess(res, { message: 'File deleted successfully' });
    } catch (error: any) {
        console.error('Delete error:', error);
        sendError(res, error.message || 'Delete failed', 500);
    }
};
