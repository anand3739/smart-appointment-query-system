import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Smart Appointment & Queue Management API',
      version: '1.0.0',
      description:
        'Production-style REST API for multi-branch appointment booking, deterministic queue prioritization, resource allocation, and analytics.',
      contact: {
        name: 'QueueFlow Engineering Team',
        email: 'engineering@queueflow.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Local Development Server',
      },
      {
        url: '/api',
        description: 'Docker / Production Server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT Bearer token obtained from /api/auth/login',
        },
        IdempotencyKey: {
          type: 'apiKey',
          in: 'header',
          name: 'Idempotency-Key',
          description: 'Unique client-generated UUID for preventing duplicate requests',
        },
      },
      schemas: {
        StandardResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
            message: { type: 'string', example: 'Operation completed successfully' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'SLOT_UNAVAILABLE' },
                message: { type: 'string', example: 'The selected appointment slot is no longer available.' },
                details: { type: 'array', items: { type: 'string' } },
              },
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
