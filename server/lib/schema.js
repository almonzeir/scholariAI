import { z } from 'zod';

// Define the DegreeTarget enum
const DegreeTargetSchema = z.enum(['Bachelor', 'Master', 'PhD']).nullable();

// Define the Profile schema
export const ProfileSchema = z.object({
  // Personal Information
  fullName: z.string().nullable(),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  dateOfBirth: z.string().nullable(), // ISO date string
  nationality: z.string().nullable(),
  address: z.string().nullable(),
  
  // Academic Background
  currentDegree: z.string().nullable(),
  institution: z.string().nullable(),
  fieldOfStudy: z.string().nullable(),
  gpa: z.number().min(0).max(4.0).nullable(),
  graduationYear: z.number().int().min(1900).max(2030).nullable(),
  
  // Target Degree
  degreeTarget: DegreeTargetSchema,
  targetField: z.string().nullable(),
  targetCountries: z.array(z.string()).default([]),
  
  // Experience
  workExperience: z.array(z.string()).default([]),
  researchExperience: z.array(z.string()).default([]),
  publications: z.array(z.string()).default([]),
  
  // Skills and Achievements
  skills: z.array(z.string()).default([]),
  languages: z.array(z.string()).default([]),
  awards: z.array(z.string()).default([]),
  certifications: z.array(z.string()).default([]),
  
  // Financial Information
  financialNeed: z.boolean().nullable(),
  familyIncome: z.number().min(0).nullable(),
  
  // Additional Information
  extracurricularActivities: z.array(z.string()).default([]),
  volunteerWork: z.array(z.string()).default([]),
  personalStatement: z.string().nullable(),
  careerGoals: z.string().nullable(),
});

// Define the Scholarship schema
export const ScholarshipSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  provider: z.string(),
  amount: z.number().min(0),
  currency: z.string().default('USD'),
  deadline: z.string(), // ISO date string
  eligibility: z.array(z.string()),
  requirements: z.array(z.string()),
  applicationUrl: z.string().url(),
  
  // Targeting criteria
  targetDegrees: z.array(DegreeTargetSchema),
  targetFields: z.array(z.string()),
  targetCountries: z.array(z.string()),
  
  // Additional metadata
  isNeedBased: z.boolean().default(false),
  isMeritBased: z.boolean().default(true),
  tags: z.array(z.string()).default([]),
  
  // AI-generated fit score (added during matching)
  fitScore: z.number().min(0).max(100).optional(),
});

// Export inferred types for TypeScript compatibility
export const Profile = ProfileSchema;
export const Scholarship = ScholarshipSchema;
export const DegreeTarget = DegreeTargetSchema;