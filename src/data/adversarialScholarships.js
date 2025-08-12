/**
 * Phase 9.2 - Adversarial Scholarship Cases for Testing
 * 10 tricky scholarship items to test edge cases:
 * - Missing deadlines
 * - Ambiguous funding
 * - Partial tuition only
 * - Wrong field/degree combos
 * - Duplicate programs from multiple sources
 */

export const ADVERSARIAL_SCHOLARSHIPS = [
  {
    id: "adv_001",
    title: "Global Excellence Scholarship",
    provider: "International Education Foundation",
    description: "Prestigious scholarship for outstanding students worldwide. Application deadline varies by region. Contact regional office for details.",
    amount: "Up to $50,000",
    currency: "USD",
    deadline: "varies", // Missing specific deadline
    eligibility: {
      degreeLevel: ["Bachelor's", "Master's", "PhD"],
      fieldOfStudy: ["Any"],
      nationality: ["Any"],
      gpaRequirement: 3.5,
      ageLimit: null
    },
    fundingType: "partial", // Ambiguous - could be full or partial
    coverage: ["Tuition", "Living expenses"], // Unclear what percentage
    applicationUrl: "https://example.com/global-excellence",
    isOfficial: true,
    source: "University Website",
    lastUpdated: "2024-01-15"
  },
  {
    id: "adv_002",
    title: "STEM Innovation Grant",
    provider: "Tech Future Foundation",
    description: "Supporting innovative research in technology fields. Partial funding available for qualified candidates.",
    amount: "$2,500 - $15,000", // Wide range, unclear criteria
    currency: "USD",
    deadline: "2024-12-31",
    eligibility: {
      degreeLevel: ["Master's", "PhD"],
      fieldOfStudy: ["Computer Science", "Engineering", "Mathematics", "Art History"], // Wrong field combo
      nationality: ["Any"],
      gpaRequirement: 3.0,
      ageLimit: 35
    },
    fundingType: "partial",
    coverage: ["Research expenses only"], // Very limited coverage
    applicationUrl: "https://example.com/stem-innovation",
    isOfficial: false,
    source: "Third-party Website",
    lastUpdated: "2023-08-20" // Outdated
  },
  {
    id: "adv_003",
    title: "Medical Excellence Award", // Duplicate - Version 1
    provider: "Health Sciences Institute",
    description: "Excellence award for medical students demonstrating outstanding academic performance and community service.",
    amount: "$10,000",
    currency: "USD",
    deadline: "2024-06-15",
    eligibility: {
      degreeLevel: ["Medical Degree"],
      fieldOfStudy: ["Medicine"],
      nationality: ["US", "Canada"],
      gpaRequirement: 3.7,
      ageLimit: null
    },
    fundingType: "partial",
    coverage: ["Tuition assistance"], // Partial tuition only
    applicationUrl: "https://healthinstitute.org/medical-award",
    isOfficial: true,
    source: "Official Website",
    lastUpdated: "2024-01-10"
  },
  {
    id: "adv_004",
    title: "Medical Excellence Award", // Duplicate - Version 2 (different details)
    provider: "Health Sciences Institute",
    description: "Prestigious scholarship for exceptional medical students with strong academic records and leadership experience.",
    amount: "$12,500", // Different amount
    currency: "USD",
    deadline: "2024-06-30", // Different deadline
    eligibility: {
      degreeLevel: ["Medical Degree"],
      fieldOfStudy: ["Medicine", "Nursing"], // Additional field
      nationality: ["US", "Canada", "Mexico"], // Additional nationality
      gpaRequirement: 3.5, // Different GPA
      ageLimit: 30 // Additional age limit
    },
    fundingType: "partial",
    coverage: ["Tuition", "Books"],
    applicationUrl: "https://scholarshipportal.com/medical-excellence",
    isOfficial: false, // Different source type
    source: "Scholarship Portal",
    lastUpdated: "2024-02-01"
  },
  {
    id: "adv_005",
    title: "Renewable Energy Research Fellowship",
    provider: "Green Future Foundation",
    description: "Fellowship for advanced research in renewable energy technologies. Deadline information will be announced soon.",
    amount: "TBD", // Amount not specified
    currency: "USD",
    deadline: "TBD", // Missing deadline
    eligibility: {
      degreeLevel: ["PhD"],
      fieldOfStudy: ["Environmental Science", "Mechanical Engineering", "Literature"], // Wrong field combo
      nationality: ["Developing countries"], // Vague nationality requirement
      gpaRequirement: null, // No GPA requirement specified
      ageLimit: null
    },
    fundingType: "unknown", // Unclear funding type
    coverage: ["Research stipend"], // Minimal coverage
    applicationUrl: "https://example.com/renewable-fellowship",
    isOfficial: true,
    source: "Foundation Website",
    lastUpdated: "2023-12-01"
  },
  {
    id: "adv_006",
    title: "International Business Leadership Scholarship",
    provider: "Global Business Council",
    description: "Scholarship for future business leaders. Covers partial tuition fees only. Additional expenses not included.",
    amount: "30% of tuition", // Percentage-based, unclear actual amount
    currency: "USD",
    deadline: "2024-04-01",
    eligibility: {
      degreeLevel: ["Bachelor's", "Master's"],
      fieldOfStudy: ["Business Administration", "Economics", "Fine Arts"], // Wrong field combo
      nationality: ["Any"],
      gpaRequirement: 3.2,
      ageLimit: 28
    },
    fundingType: "partial",
    coverage: ["Partial tuition only"], // Very limited
    applicationUrl: "https://example.com/business-leadership",
    isOfficial: false,
    source: "Educational Blog",
    lastUpdated: "2024-01-05"
  },
  {
    id: "adv_007",
    title: "Women in STEM Excellence Award", // Duplicate - Version 1
    provider: "Women's Education Foundation",
    description: "Supporting women pursuing careers in science, technology, engineering, and mathematics.",
    amount: "$8,000",
    currency: "USD",
    deadline: "2024-08-15",
    eligibility: {
      degreeLevel: ["Bachelor's", "Master's"],
      fieldOfStudy: ["Computer Science", "Engineering", "Mathematics", "Physics"],
      nationality: ["Any"],
      gpaRequirement: 3.3,
      ageLimit: null,
      gender: "Female" // Gender-specific requirement
    },
    fundingType: "partial",
    coverage: ["Tuition support"],
    applicationUrl: "https://womensfoundation.org/stem-award",
    isOfficial: true,
    source: "Foundation Website",
    lastUpdated: "2024-01-20"
  },
  {
    id: "adv_008",
    title: "Women in STEM Excellence Award", // Duplicate - Version 2
    provider: "Women's Education Foundation",
    description: "Empowering women in STEM fields through financial support and mentorship opportunities.",
    amount: "$7,500 + mentorship", // Different structure
    currency: "USD",
    deadline: "2024-08-31", // Different deadline
    eligibility: {
      degreeLevel: ["Bachelor's", "Master's", "PhD"], // Additional degree level
      fieldOfStudy: ["Computer Science", "Engineering", "Mathematics", "Physics", "Biology"], // Additional field
      nationality: ["US", "Canada"], // More restrictive
      gpaRequirement: 3.5, // Higher GPA
      ageLimit: 25, // Age limit added
      gender: "Female"
    },
    fundingType: "partial",
    coverage: ["Tuition", "Mentorship program"],
    applicationUrl: "https://scholarships.edu/women-stem",
    isOfficial: false,
    source: "Scholarship Database",
    lastUpdated: "2024-02-10"
  },
  {
    id: "adv_009",
    title: "Cultural Heritage Preservation Grant",
    provider: "Heritage Foundation",
    description: "Grant for students researching cultural preservation. Application process varies by country. Check local embassy for details.",
    amount: "€5,000 - €25,000", // Different currency, wide range
    currency: "EUR",
    deadline: "Rolling basis", // Unclear deadline
    eligibility: {
      degreeLevel: ["Master's", "PhD"],
      fieldOfStudy: ["Anthropology", "History", "Cultural Studies", "Computer Science"], // Wrong field combo
      nationality: ["EU countries", "Associated partners"], // Vague requirements
      gpaRequirement: null,
      ageLimit: null
    },
    fundingType: "variable", // Unclear funding type
    coverage: ["Research expenses", "Travel costs"], // Limited coverage
    applicationUrl: "https://example.com/heritage-grant",
    isOfficial: true,
    source: "Government Portal",
    lastUpdated: "2023-11-15"
  },
  {
    id: "adv_010",
    title: "Future Leaders Scholarship Program",
    provider: "Leadership Institute",
    description: "Comprehensive scholarship program for emerging leaders. Covers books and supplies only. Tuition not included.",
    amount: "$1,500 per semester", // Very limited amount
    currency: "USD",
    deadline: "2024-05-30",
    eligibility: {
      degreeLevel: ["Bachelor's"],
      fieldOfStudy: ["Political Science", "International Relations", "Public Administration", "Culinary Arts"], // Wrong field combo
      nationality: ["Any"],
      gpaRequirement: 2.8, // Low GPA requirement
      ageLimit: 22
    },
    fundingType: "partial",
    coverage: ["Books and supplies only"], // Very limited coverage
    applicationUrl: "https://example.com/future-leaders",
    isOfficial: false,
    source: "Student Forum",
    lastUpdated: "2023-09-10" // Outdated
  }
];

export default ADVERSARIAL_SCHOLARSHIPS;