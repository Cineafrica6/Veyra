import { Router } from 'express';
import {
    createSubmission,
    listSubmissions,
    getPendingSubmissions,
    getSubmission,
    verifySubmission,
} from '../controllers';
import {
    authenticate,
    requireTrackMember,
    requireTrackAdmin,
} from '../middleware';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/submissions/track/{trackId}:
 *   post:
 *     summary: Submit weekly progress (one per week per user)
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: trackId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - description
 *               - proofUrl
 *               - proofType
 *             properties:
 *               description:
 *                 type: string
 *                 minLength: 10
 *               proofUrl:
 *                 type: string
 *               proofType:
 *                 type: string
 *                 enum: [image, file, link]
 *     responses:
 *       201:
 *         description: Submission created
 *       409:
 *         description: Already submitted this week
 */
router.post('/track/:trackId', requireTrackMember, createSubmission);

/**
 * @swagger
 * /api/submissions/track/{trackId}:
 *   get:
 *     summary: List submissions for a track
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: trackId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: week
 *         schema:
 *           type: string
 *         description: "Filter by week: 'current', 'previous', or ISO date"
 *     responses:
 *       200:
 *         description: List of submissions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Submission'
 */
router.get('/track/:trackId', requireTrackMember, listSubmissions);

/**
 * @swagger
 * /api/submissions/track/{trackId}/pending:
 *   get:
 *     summary: Get pending submissions (admin only)
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: trackId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of pending submissions
 */
router.get('/track/:trackId/pending', requireTrackAdmin, getPendingSubmissions);

/**
 * @swagger
 * /api/submissions/{id}:
 *   get:
 *     summary: Get submission details
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Submission details
 *       403:
 *         description: Access denied
 */
router.get('/:id', getSubmission);

/**
 * @swagger
 * /api/submissions/{id}/verify:
 *   post:
 *     summary: Verify (approve/reject) a submission (admin only)
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [approved, rejected]
 *               score:
 *                 type: number
 *                 description: Required when approving
 *     responses:
 *       200:
 *         description: Submission verified
 *       400:
 *         description: Invalid score or status
 */
router.post('/:id/verify', verifySubmission);

export default router;
