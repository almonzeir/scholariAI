// lib/schema.ts
import { z } from "zod";

export const ProfileSchema = z.object({
  name: z.string().nullable().optional(),
  nationality: z.string().nullable(),
  degreeTarget: z.enum(["Bachelor", "Master", "PhD"]).nullable(),
  field: z.string().nullable(),
  gpa: z.string().nullable().optional(),
  certifications: z.array(z.string()).optional().default([]),
  specialStatus: z.string().nullable().optional(),
  languages: z.array(z.string()).optional().default([]),
});

export const ScholarshipSchema = z.object({
  id: z.string(),
  name: z.string(),
  country: z.string(),
  degree: z.union([z.enum(["Bachelor", "Master", "PhD"]), z.literal("Any")]),
  eligibility: z.string().max(180),
  deadline: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.literal("varies")]),
  link: z.string().url(),
  source: z.string(),
  fitScore: z.number().min(0).max(1),
});

export type Profile = z.infer<typeof ProfileSchema>;
export type Scholarship = z.infer<typeof ScholarshipSchema>;