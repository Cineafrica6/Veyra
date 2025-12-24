import { Router } from 'express';
import {
    createTrack,
    listTracks,
    getTrack,
    getMyTracks,
    updateTrack,
    joinTrack,
    joinTrackDirect,
    regenerateInvite,
    toggleInvite,
    listTrackMembers,
    addTrackMember,
    banMember,
    unbanMember,
    suspendMember,
    unsuspendMember,
    promoteToAdmin,
    demoteFromAdmin,
    dailyCheckIn,
    deleteTrack,
} from '../controllers';
import {
    authenticate,
    requireOrgRole,
    requireTrackMember,
    requireTrackAdmin,
} from '../middleware';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/tracks/join:
 *   post:
 *     summary: Join a track via invite code
 *     tags: [Tracks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - inviteCode
 *             properties:
 *               inviteCode:
 *                 type: string
 *                 description: 8-character invite code
 *     responses:
 *       200:
 *         description: Successfully joined track
 *       404:
 *         description: Invalid invite code
 *       409:
 *         description: Already a member
 */
router.post('/join', joinTrack);

/**
 * @swagger
 * /api/tracks/my-tracks:
 *   get:
 *     summary: Get all tracks the current user is a member of
 *     tags: [Tracks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's tracks
 */
router.get('/my-tracks', getMyTracks);

/**
 * @swagger
 * /api/tracks/org/{orgId}:
 *   post:
 *     summary: Create a new track (owner/admin only)
 *     tags: [Tracks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orgId
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
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               weekStartDay:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 6
 *                 default: 1
 *                 description: 0=Sunday, 1=Monday, etc.
 *               minScore:
 *                 type: number
 *                 default: 0
 *               maxScore:
 *                 type: number
 *                 default: 10
 *               maxMembers:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Track created
 */
router.post('/org/:orgId', requireOrgRole('owner', 'admin'), createTrack);

/**
 * @swagger
 * /api/tracks/org/{orgId}:
 *   get:
 *     summary: List tracks in an organization
 *     tags: [Tracks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orgId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of tracks
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
 *                     $ref: '#/components/schemas/Track'
 */
router.get('/org/:orgId', requireOrgRole('owner', 'admin', 'member'), listTracks);

/**
 * @swagger
 * /api/tracks/{id}:
 *   get:
 *     summary: Get track details
 *     tags: [Tracks]
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
 *         description: Track details
 *       403:
 *         description: Not a track member
 */
router.get('/:id', requireTrackMember, getTrack);

/**
 * @swagger
 * /api/tracks/{id}/join:
 *   post:
 *     summary: Join a track directly (org members only)
 *     tags: [Tracks]
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
 *         description: Successfully joined track
 *       403:
 *         description: Not an org member
 *       409:
 *         description: Already a member
 */
router.post('/:id/join', authenticate, joinTrackDirect);

/**
 * @swagger
 * /api/tracks/{id}:
 *   patch:
 *     summary: Update track (admin only)
 *     tags: [Tracks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               weekStartDay:
 *                 type: integer
 *               minScore:
 *                 type: number
 *               maxScore:
 *                 type: number
 *     responses:
 *       200:
 *         description: Track updated
 */
router.patch('/:id', requireTrackAdmin, updateTrack);

/**
 * @swagger
 * /api/tracks/{id}/regenerate-invite:
 *   post:
 *     summary: Regenerate invite code (admin only)
 *     tags: [Tracks]
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
 *         description: New invite code generated
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
 *                     inviteCode:
 *                       type: string
 */
router.post('/:id/regenerate-invite', requireTrackAdmin, regenerateInvite);

/**
 * @swagger
 * /api/tracks/{id}/invite:
 *   patch:
 *     summary: Enable/disable invites (admin only)
 *     tags: [Tracks]
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
 *               - enabled
 *             properties:
 *               enabled:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Invite status updated
 */
router.patch('/:id/invite', requireTrackAdmin, toggleInvite);

/**
 * @swagger
 * /api/tracks/{id}/members:
 *   get:
 *     summary: List track members
 *     tags: [Tracks]
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
 *         description: List of track members
 */
router.get('/:id/members', requireTrackMember, listTrackMembers);

/**
 * @swagger
 * /api/tracks/{id}/members:
 *   post:
 *     summary: Add member by email (admin only)
 *     tags: [Tracks]
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
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 description: Email of user to add
 *               role:
 *                 type: string
 *                 enum: [admin, member]
 *                 default: member
 *     responses:
 *       201:
 *         description: Member added
 *       404:
 *         description: User not found
 *       409:
 *         description: Already a member
 */
router.post('/:id/members', addTrackMember);

/**
 * @swagger
 * /api/tracks/{id}/members/{targetUserId}/ban:
 *   post:
 *     summary: Ban a member (admin only)
 *     tags: [Tracks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: targetUserId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Member banned
 *       403:
 *         description: Not authorized
 */
router.post('/:id/members/:targetUserId/ban', banMember);

/**
 * @swagger
 * /api/tracks/{id}/members/{targetUserId}/ban:
 *   delete:
 *     summary: Unban a member (admin only)
 *     tags: [Tracks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: targetUserId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Member unbanned
 */
router.delete('/:id/members/:targetUserId/ban', unbanMember);

// Suspend/Unsuspend routes
router.post('/:id/members/:targetUserId/suspend', suspendMember);
router.delete('/:id/members/:targetUserId/suspend', unsuspendMember);

// Promote/Demote routes
router.post('/:id/members/:targetUserId/promote', promoteToAdmin);
router.delete('/:id/members/:targetUserId/promote', demoteFromAdmin);

/**
 * @swagger
 * /api/tracks/{id}/check-in:
 *   post:
 *     summary: Submit a daily check-in (streak only)
 *     tags: [Tracks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               note:
 *                 type: string
 *                 maxLength: 140
 *     responses:
 *       201:
 *         description: Check-in successful
 *       403:
 *         description: Not a member
 *       409:
 *         description: Already checked in today
 */
router.post('/:id/check-in', requireTrackMember, dailyCheckIn);

/**
 * @swagger
 * /api/tracks/{id}:
 *   delete:
 *     summary: Delete a track (admin only)
 *     tags: [Tracks]
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
 *         description: Track deleted
 *       403:
 *         description: Access denied
 */
router.delete('/:id', authenticate, deleteTrack);

export default router;
