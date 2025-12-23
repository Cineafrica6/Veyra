import { Router } from 'express';
import {
    createQuiz,
    getCurrentQuiz,
    listQuizzes,
    submitQuizResponse,
    getQuizResponses,
    scoreQuizResponse,
} from '../controllers';
import { authenticate } from '../middleware';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/tracks/{id}/quizzes:
 *   post:
 *     summary: Create a quiz for current week (admin only)
 *     tags: [Quizzes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Track ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - question
 *             properties:
 *               question:
 *                 type: string
 *                 description: Essay question
 *     responses:
 *       201:
 *         description: Quiz created
 */
router.post('/tracks/:id/quizzes', createQuiz);

/**
 * @swagger
 * /api/tracks/{id}/quizzes:
 *   get:
 *     summary: List all quizzes for a track (admin only)
 *     tags: [Quizzes]
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
 *         description: List of quizzes
 */
router.get('/tracks/:id/quizzes', listQuizzes);

/**
 * @swagger
 * /api/tracks/{id}/quizzes/current:
 *   get:
 *     summary: Get current week's quiz
 *     tags: [Quizzes]
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
 *         description: Current quiz or null
 */
router.get('/tracks/:id/quizzes/current', getCurrentQuiz);

/**
 * @swagger
 * /api/quizzes/{quizId}/respond:
 *   post:
 *     summary: Submit an answer to a quiz
 *     tags: [Quizzes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: quizId
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
 *               - answer
 *             properties:
 *               answer:
 *                 type: string
 *                 description: Essay answer
 *     responses:
 *       201:
 *         description: Response submitted
 */
router.post('/quizzes/:quizId/respond', submitQuizResponse);

/**
 * @swagger
 * /api/quizzes/{quizId}/responses:
 *   get:
 *     summary: Get all responses to a quiz (admin only)
 *     tags: [Quizzes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: quizId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of responses
 */
router.get('/quizzes/:quizId/responses', getQuizResponses);

/**
 * @swagger
 * /api/quiz-responses/{responseId}/score:
 *   post:
 *     summary: Score a quiz response (admin only)
 *     tags: [Quizzes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: responseId
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
 *               - score
 *             properties:
 *               score:
 *                 type: number
 *                 description: Score to assign
 *     responses:
 *       200:
 *         description: Response scored
 */
router.post('/quiz-responses/:responseId/score', scoreQuizResponse);

export default router;
