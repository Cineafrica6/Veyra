import { Router } from 'express';
import multer from 'multer';
import { uploadProof, deleteUpload } from '../controllers';
import { authenticate } from '../middleware';

const router = Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
        const allowedMimes = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'application/pdf',
            'video/mp4',
            'video/webm',
        ];

        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'));
        }
    },
});

router.use(authenticate);

/**
 * @swagger
 * /api/upload/proof:
 *   post:
 *     summary: Upload proof file to Cloudinary
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: "Max 10MB. Allowed: jpg, png, gif, webp, pdf, mp4, webm"
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                     publicId:
 *                       type: string
 *                     proofType:
 *                       type: string
 *                       enum: [image, file]
 *                     format:
 *                       type: string
 *                     size:
 *                       type: integer
 *       400:
 *         description: No file or invalid file type
 */
router.post('/proof', upload.single('file'), uploadProof);

/**
 * @swagger
 * /api/upload/{publicId}:
 *   delete:
 *     summary: Delete an uploaded file
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: publicId
 *         required: true
 *         schema:
 *           type: string
 *         description: Cloudinary public ID
 *     responses:
 *       200:
 *         description: File deleted
 */
router.delete('/:publicId', deleteUpload);

export default router;
