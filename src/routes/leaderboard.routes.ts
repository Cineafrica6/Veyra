import { Router } from 'express';
import { getLeaderboard, getMyRank } from '../controllers';
import { authenticate, requireTrackMember } from '../middleware';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/leaderboard/track/{trackId}:
 *   get:
 *     summary: Get weekly leaderboard for a track
 *     tags: [Leaderboard]
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
 *         description: "Week to retrieve: 'current', 'previous', or ISO date"
 *     responses:
 *       200:
 *         description: Weekly leaderboard
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
 *                     weekStart:
 *                       type: string
 *                       format: date-time
 *                     weekEnd:
 *                       type: string
 *                       format: date-time
 *                     weekRange:
 *                       type: string
 *                       example: "Dec 23 - Dec 29"
 *                     stats:
 *                       type: object
 *                       properties:
 *                         totalParticipants:
 *                           type: integer
 *                         totalSubmissions:
 *                           type: integer
 *                         averageScore:
 *                           type: number
 *                     leaderboard:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/LeaderboardEntry'
 */
router.get('/track/:trackId', requireTrackMember, getLeaderboard);

/**
 * @swagger
 * /api/leaderboard/track/{trackId}/my-rank:
 *   get:
 *     summary: Get current user's rank in the leaderboard
 *     tags: [Leaderboard]
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
 *         description: User's rank
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
 *                     rank:
 *                       type: integer
 *                       nullable: true
 *                     totalScore:
 *                       type: number
 *                     totalParticipants:
 *                       type: integer
 */
router.get('/track/:trackId/my-rank', requireTrackMember, getMyRank);

export default router;
