import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import routes from './routes';
import { swaggerSpec } from './docs/swagger';
import { errorHandler } from './middlewares/error.middleware';

export const app = express();

// Security and utility middlewares
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger Documentation (available at /api/docs, /api-docs, and /docs)
app.use(['/api/docs', '/api-docs', '/docs'], swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API Routes
app.use('/api', routes);

// Centralized error handling
app.use(errorHandler);
