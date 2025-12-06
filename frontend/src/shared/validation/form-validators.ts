import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Project name is too long'),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  segment: z.object({
    description: z.string().min(1),
    demographics: z.record(z.string(), z.any()),
  }).optional(),
  hypothesis: z.object({
    description: z.string().min(1),
    assumptions: z.array(z.string()),
  }).optional(),
});

export const surveyAnswerSchema = z.object({
  questionId: z.string().min(1),
  value: z.union([z.string(), z.number()]),
  audioUrl: z.string().url().optional(),
});

export const submitSurveySchema = z.object({
  token: z.string().min(1),
  answers: z.array(surveyAnswerSchema),
});

