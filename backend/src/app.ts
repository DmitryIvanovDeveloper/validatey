import 'reflect-metadata';
// .env loaded before container so process.env is set for all modules (same as painkiller-assistent)
import 'dotenv/config';
import './infrastructure/bootstrap/container';
import express, { Request, Response } from 'express';
import { getEnvStatus } from './infrastructure/config/env-check';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';

const app = express();

// CORS: exact origin(s), never * (required when credentials: true from frontend)
const allowedOrigins = (process.env.FRONTEND_ORIGIN || 'http://localhost:5173').split(',').map((s) => s.trim());
app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, origin);
      return cb(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id'],
  })
);
app.use(cookieParser());

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({ 
    message: 'Validatey Backend API',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint (includes env key presence, no values)
app.get('/health', (req: Request, res: Response) => {
  const envStatus = getEnvStatus();
  res.json({
    status: envStatus.ok ? 'OK' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    env: {
      required: envStatus.required,
      optional: envStatus.optional,
      missing: envStatus.missing,
    },
  });
});

// API routes
import projectsRoutes from './modules/projects/interface-adapters/routes/projects.routes';
import projectsNestedRoutes from './modules/projects/interface-adapters/routes/projects-nested.routes';
import scenariosRoutes from './modules/scenarios/interface-adapters/routes/scenarios.routes';
import invitationsRoutes from './modules/invitations/interface-adapters/routes/invitations.routes';
import publicInvitationsRoutes from './modules/invitations/interface-adapters/routes/public-invitations.routes';
import tasksRoutes from './modules/tasks/interface-adapters/routes/tasks.routes';
import responsesRoutes from './modules/responses/interface-adapters/routes/responses.routes';
import publicResponsesRoutes from './modules/responses/interface-adapters/routes/public-responses.routes';
import metricsRoutes from './modules/metrics/interface-adapters/routes/metrics.routes';
import reportsRoutes from './modules/reports/interface-adapters/routes/reports.routes';
import publicReportsRoutes from './modules/reports/interface-adapters/routes/public-reports.routes';
import storageRoutes from './modules/storage/interface-adapters/routes/storage.routes';
import audioUploadRoutes from './modules/storage/interface-adapters/routes/audio-upload.routes';
import telemetryRoutes from './modules/telemetry/interface-adapters/routes/telemetry.routes';
import surveyRoutes from './modules/surveys/interface-adapters/routes/survey.routes';
import aiRoutes from './modules/ai/routes/hypothesis-suggest.routes';
import authRoutes from './modules/auth/interface-adapters/routes/auth.routes';

app.use('/api/projects', projectsRoutes);
app.use('/api/projects', projectsNestedRoutes); // Nested routes: /projects/:projectId/scenarios, /invitations, /report
app.use('/api/scenarios', scenariosRoutes); // Keep flat routes for backward compatibility
app.use('/api/invitations', invitationsRoutes);
app.use('/api/public/invitations', publicInvitationsRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/responses', responsesRoutes);
app.use('/api/public/responses', publicResponsesRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/public/reports', publicReportsRoutes);
app.use('/api/storage', storageRoutes);
app.use('/api/audio-upload', audioUploadRoutes);
app.use('/api/telemetry', telemetryRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/auth', authRoutes);
app.use('/survey', surveyRoutes);

app.get('/api', (req: Request, res: Response) => {
  res.json({ 
    message: 'Validatey API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      projects: '/api/projects',
      scenarios: '/api/scenarios',
      scenariosVerifyLlm: 'POST /api/scenarios/verify-llm',
      invitations: '/api/invitations',
      publicInvitations: '/api/public/invitations',
      tasks: '/api/tasks',
      responses: '/api/responses',
      publicResponses: '/api/public/responses',
      metrics: '/api/metrics',
      reports: '/api/reports',
      publicReports: '/api/public/reports',
      storage: '/api/storage',
      audioUpload: '/api/audio-upload',
      telemetry: '/api/telemetry',
      auth: '/api/auth (google-url, session, sign-out)',
      survey: '/survey',
      root: '/'
    }
  });
});

export default app;
