// types/shared.ts
export type DegreeTarget = "Bachelor" | "Master" | "PhD";

export interface Profile {
  name?: string | null;
  nationality: string | null;
  degreeTarget: DegreeTarget | null;
  field: string | null;
  gpa?: string | null;
  certifications?: string[];       // e.g., ["PMP", "IELTS 7.0"]
  specialStatus?: string | null;   // e.g., "refugee", "low-income"
  languages?: string[];
}

export interface Scholarship {
  id: string;
  name: string;
  country: string;
  degree: DegreeTarget | "Any";
  eligibility: string;             // ≤ 180 chars
  deadline: string;                // ISO "YYYY-MM-DD" or "varies"
  link: string;                    // direct official URL
  source: string;                  // domain, e.g., "daad.de"
  fitScore: number;                // 0..1
}