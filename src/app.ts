import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';

import { connectDB, swaggerSpec } from './config';
import { errorHandler } from './middleware';
import {
    authRoutes,
    organizationRoutes,
    trackRoutes,
    submissionRoutes,
    leaderboardRoutes,
    uploadRoutes,
    quizRoutes,
} from './routes';

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet({
    contentSecurityPolicy: false, // Allow Swagger UI inline scripts
}));
app.use(cors({
    origin: '*', // Allow all origins for development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger UI
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Veyra API Documentation',
}));

// Swagger JSON
app.get('/api/docs.json', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

// Health check
app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/tracks', trackRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api', quizRoutes); // Quiz routes mounted at /api level

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        error: 'Route not found',
    });
});

// Error handler
app.use(errorHandler);

// Start server
const startServer = async (): Promise<void> => {
    try {
        // Connect to MongoDB
        await connectDB();

        app.listen(PORT, () => {
            console.log(`🚀 Veyra Backend running on port ${PORT}`);
            console.log(`📍 Health check: http://localhost:${PORT}/health`);
            console.log(`📚 API Docs: http://localhost:${PORT}/api/docs`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

export default app;
