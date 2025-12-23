import { Router } from 'express';
import {
    createOrganization,
    listOrganizations,
    getOrganization,
    updateOrganization,
    listMembers,
    addMember,
    updateMemberRole,
    removeMember,
} from '../controllers';
import { authenticate, requireOrgRole } from '../middleware';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/organizations:
 *   post:
 *     summary: Create a new organization
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
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
 *                 minLength: 2
 *     responses:
 *       201:
 *         description: Organization created
 *       400:
 *         description: Invalid input
 */
router.post('/', createOrganization);

/**
 * @swagger
 * /api/organizations:
 *   get:
 *     summary: List all organizations the user belongs to
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of organizations
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
 *                     $ref: '#/components/schemas/Organization'
 */
router.get('/', listOrganizations);

/**
 * @swagger
 * /api/organizations/{id}:
 *   get:
 *     summary: Get organization details
 *     tags: [Organizations]
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
 *         description: Organization details
 *       404:
 *         description: Organization not found
 */
router.get('/:id', requireOrgRole('owner', 'admin', 'member'), getOrganization);

/**
 * @swagger
 * /api/organizations/{id}:
 *   patch:
 *     summary: Update organization (owner/admin only)
 *     tags: [Organizations]
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
 *     responses:
 *       200:
 *         description: Organization updated
 *       403:
 *         description: Access denied
 */
router.patch('/:id', requireOrgRole('owner', 'admin'), updateOrganization);

/**
 * @swagger
 * /api/organizations/{id}/members:
 *   get:
 *     summary: List organization members
 *     tags: [Organizations]
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
 *         description: List of members
 */
router.get('/:id/members', requireOrgRole('owner', 'admin', 'member'), listMembers);

/**
 * @swagger
 * /api/organizations/{id}/members:
 *   post:
 *     summary: Add member by email (owner/admin only)
 *     tags: [Organizations]
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
 *                 format: email
 *               role:
 *                 type: string
 *                 enum: [admin, member]
 *                 default: member
 *     responses:
 *       201:
 *         description: Member added
 *       404:
 *         description: User not found
 */
router.post('/:id/members', requireOrgRole('owner', 'admin'), addMember);

/**
 * @swagger
 * /api/organizations/{id}/members/{userId}:
 *   patch:
 *     summary: Update member role (owner only)
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
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
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [admin, member]
 *     responses:
 *       200:
 *         description: Role updated
 */
router.patch('/:id/members/:userId', requireOrgRole('owner'), updateMemberRole);

/**
 * @swagger
 * /api/organizations/{id}/members/{userId}:
 *   delete:
 *     summary: Remove member (owner/admin only)
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Member removed
 */
router.delete('/:id/members/:userId', requireOrgRole('owner', 'admin'), removeMember);

export default router;
