import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Veyra API',
            version: '1.0.0',
            description: 'Multi-tenant progress verification and leaderboard platform API',
            contact: {
                name: 'Veyra Support',
            },
        },
        servers: [
            {
                url: 'http://localhost:3001',
                description: 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Enter your Supabase JWT token',
                },
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', description: 'User ID' },
                        email: { type: 'string', format: 'email' },
                        displayName: { type: 'string' },
                        avatarUrl: { type: 'string' },
                        createdAt: { type: 'string', format: 'date-time' },
                    },
                },
                Organization: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        slug: { type: 'string' },
                        role: { type: 'string', enum: ['owner', 'admin', 'member'] },
                        createdAt: { type: 'string', format: 'date-time' },
                    },
                },
                Track: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        description: { type: 'string' },
                        weekStartDay: { type: 'integer', minimum: 0, maximum: 6 },
                        minScore: { type: 'number' },
                        maxScore: { type: 'number' },
                        inviteCode: { type: 'string' },
                        inviteEnabled: { type: 'boolean' },
                        maxMembers: { type: 'integer' },
                        memberCount: { type: 'integer' },
                    },
                },
                Submission: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        user: { $ref: '#/components/schemas/User' },
                        weekStart: { type: 'string', format: 'date-time' },
                        weekEnd: { type: 'string', format: 'date-time' },
                        description: { type: 'string' },
                        proofUrl: { type: 'string' },
                        proofType: { type: 'string', enum: ['image', 'file', 'link'] },
                        status: { type: 'string', enum: ['pending', 'approved', 'rejected'] },
                        score: { type: 'number' },
                        verifiedAt: { type: 'string', format: 'date-time' },
                        createdAt: { type: 'string', format: 'date-time' },
                    },
                },
                LeaderboardEntry: {
                    type: 'object',
                    properties: {
                        rank: { type: 'integer' },
                        userId: { type: 'string' },
                        displayName: { type: 'string' },
                        avatarUrl: { type: 'string' },
                        totalScore: { type: 'number' },
                        submissionCount: { type: 'integer' },
                    },
                },
                Error: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        error: { type: 'string' },
                    },
                },
                Success: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        data: { type: 'object' },
                        message: { type: 'string' },
                    },
                },
            },
        },
        security: [{ bearerAuth: [] }],
    },
    apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
