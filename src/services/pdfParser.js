/**
 * Advanced PDF Parser Service
 * Extracts and analyzes text from PDF files
 */

import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export class PDFParserService {
  /**
   * Extract text from PDF file
   * @param {File} pdfFile - PDF file to parse
   * @returns {Promise<string>} - Extracted text content
   */
  static async extractTextFromPDF(pdfFile) {
    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = '';
      
      // Extract text from each page
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        const pageText = textContent.items
          .map(item => item.str)
          .join(' ');
        
        fullText += pageText + '\n';
      }
      
      return fullText.trim();
    } catch (error) {
      console.error('PDF extraction error:', error);
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  }

  /**
   * Analyze and structure CV text using advanced parsing
   * @param {string} text - Raw text from PDF
   * @returns {Object} - Structured CV data
   */
  static analyzeCV(text) {
    const sections = {
      personalInfo: this.extractPersonalInfo(text),
      education: this.extractEducation(text),
      experience: this.extractExperience(text),
      skills: this.extractSkills(text),
      achievements: this.extractAchievements(text),
      interests: this.extractInterests(text)
    };
    
    return sections;
  }

  /**
   * Extract personal information from CV text
   * @param {string} text - CV text
   * @returns {Object} - Personal information
   */
  static extractPersonalInfo(text) {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const phoneRegex = /(?:\+?1[-. ]?)?\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})/g;
    const nameRegex = /^([A-Z][a-z]+ [A-Z][a-z]+)/m;
    
    const emails = text.match(emailRegex) || [];
    const phones = text.match(phoneRegex) || [];
    const names = text.match(nameRegex) || [];
    
    return {
      name: names[0] || 'Not specified',
      email: emails[0] || 'Not specified',
      phone: phones[0] || 'Not specified',
      location: this.extractLocation(text)
    };
  }

  /**
   * Extract location from CV text
   * @param {string} text - CV text
   * @returns {string} - Location
   */
  static extractLocation(text) {
    const locationPatterns = [
      /(?:Address|Location|Based in|Located in)[:\s]+([^\n]+)/i,
      /([A-Z][a-z]+,\s*[A-Z]{2})/g,
      /([A-Z][a-z]+,\s*[A-Z][a-z]+)/g
    ];
    
    for (const pattern of locationPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1] || match[0];
      }
    }
    
    return 'Not specified';
  }

  /**
   * Extract education information
   * @param {string} text - CV text
   * @returns {Array} - Education entries
   */
  static extractEducation(text) {
    const educationSection = this.extractSection(text, ['education', 'academic', 'qualification']);
    const degreePatterns = [
      /(?:Bachelor|Master|PhD|Doctorate|Associate|Certificate)\s+(?:of\s+)?(?:Science|Arts|Engineering|Business|Medicine)?\s*(?:in\s+)?([^\n,]+)/gi,
      /(?:B\.?[AS]|M\.?[AS]|Ph\.?D|MBA)\s*(?:in\s+)?([^\n,]+)/gi
    ];
    
    const education = [];
    
    for (const pattern of degreePatterns) {
      const matches = educationSection.matchAll(pattern);
      for (const match of matches) {
        education.push({
          degree: match[0],
          field: match[1] || 'Not specified',
          institution: this.extractInstitution(educationSection, match.index),
          year: this.extractYear(educationSection, match.index)
        });
      }
    }
    
    return education.length > 0 ? education : [{
      degree: 'Not specified',
      field: 'Not specified',
      institution: 'Not specified',
      year: 'Not specified'
    }];
  }

  /**
   * Extract work experience
   * @param {string} text - CV text
   * @returns {Array} - Experience entries
   */
  static extractExperience(text) {
    const experienceSection = this.extractSection(text, ['experience', 'work', 'employment', 'career']);
    const jobTitlePatterns = [
      /(?:^|\n)([A-Z][^\n]*(?:Engineer|Developer|Manager|Analyst|Specialist|Coordinator|Assistant|Director|Lead|Senior|Junior)[^\n]*)/gm,
      /(?:Position|Role|Title)[:\s]+([^\n]+)/gi
    ];
    
    const experience = [];
    
    for (const pattern of jobTitlePatterns) {
      const matches = experienceSection.matchAll(pattern);
      for (const match of matches) {
        experience.push({
          title: match[1].trim(),
          company: this.extractCompany(experienceSection, match.index),
          duration: this.extractDuration(experienceSection, match.index),
          description: this.extractJobDescription(experienceSection, match.index)
        });
      }
    }
    
    return experience.slice(0, 5); // Limit to 5 most recent
  }

  /**
   * Extract skills from CV text
   * @param {string} text - CV text
   * @returns {Array} - Skills array
   */
  static extractSkills(text) {
    const skillsSection = this.extractSection(text, ['skills', 'technical', 'competencies', 'technologies']);
    
    const commonSkills = [
      // Programming languages
      'JavaScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Rust', 'Swift',
      // Web technologies
      'React', 'Angular', 'Vue', 'Node.js', 'Express', 'HTML', 'CSS', 'TypeScript',
      // Databases
      'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'SQLite',
      // Cloud & DevOps
      'AWS', 'Azure', 'Docker', 'Kubernetes', 'Git', 'Jenkins',
      // Data Science
      'Machine Learning', 'Data Analysis', 'TensorFlow', 'PyTorch', 'Pandas', 'NumPy',
      // Other
      'Project Management', 'Leadership', 'Communication', 'Problem Solving'
    ];
    
    const foundSkills = [];
    const textLower = skillsSection.toLowerCase();
    
    for (const skill of commonSkills) {
      if (textLower.includes(skill.toLowerCase())) {
        foundSkills.push(skill);
      }
    }
    
    // Extract additional skills using patterns
    const skillPatterns = [
      /(?:Skills|Technologies|Tools)[:\s]*([^\n]+)/gi,
      /(?:Proficient in|Experience with|Knowledge of)[:\s]*([^\n]+)/gi
    ];
    
    for (const pattern of skillPatterns) {
      const matches = skillsSection.matchAll(pattern);
      for (const match of matches) {
        const skills = match[1].split(/[,;|]/).map(s => s.trim()).filter(s => s.length > 2);
        foundSkills.push(...skills.slice(0, 3)); // Limit additional skills
      }
    }
    
    return [...new Set(foundSkills)].slice(0, 15); // Remove duplicates and limit
  }

  /**
   * Extract achievements from CV text
   * @param {string} text - CV text
   * @returns {Array} - Achievements array
   */
  static extractAchievements(text) {
    const achievementSection = this.extractSection(text, ['achievements', 'awards', 'honors', 'accomplishments']);
    
    const achievementPatterns = [
      /(?:Award|Prize|Recognition|Honor|Achievement)[:\s]*([^\n]+)/gi,
      /(?:Dean's List|Magna Cum Laude|Summa Cum Laude|Cum Laude)/gi,
      /(?:First Place|Winner|Champion|Top \d+)/gi
    ];
    
    const achievements = [];
    
    for (const pattern of achievementPatterns) {
      const matches = achievementSection.matchAll(pattern);
      for (const match of matches) {
        achievements.push(match[0].trim());
      }
    }
    
    return [...new Set(achievements)].slice(0, 10); // Remove duplicates and limit
  }

  /**
   * Extract interests from CV text
   * @param {string} text - CV text
   * @returns {Array} - Interests array
   */
  static extractInterests(text) {
    const interestsSection = this.extractSection(text, ['interests', 'hobbies', 'activities', 'personal']);
    
    const commonInterests = [
      'Machine Learning', 'Artificial Intelligence', 'Web Development', 'Mobile Development',
      'Data Science', 'Cybersecurity', 'Cloud Computing', 'Blockchain', 'IoT',
      'Research', 'Innovation', 'Entrepreneurship', 'Leadership', 'Mentoring',
      'Open Source', 'Community Service', 'Volunteering', 'Teaching'
    ];
    
    const foundInterests = [];
    const textLower = interestsSection.toLowerCase();
    
    for (const interest of commonInterests) {
      if (textLower.includes(interest.toLowerCase())) {
        foundInterests.push(interest);
      }
    }
    
    return foundInterests.slice(0, 8); // Limit interests
  }

  // Helper methods
  static extractSection(text, keywords) {
    for (const keyword of keywords) {
      const regex = new RegExp(`(${keyword}[^\n]*\n[\s\S]*?)(?=\n[A-Z][^\n]*:|$)`, 'i');
      const match = text.match(regex);
      if (match) {
        return match[1];
      }
    }
    return text; // Return full text if no section found
  }

  static extractInstitution(text, position) {
    const beforeText = text.substring(Math.max(0, position - 200), position);
    const afterText = text.substring(position, position + 200);
    
    const institutionPatterns = [
      /(?:University|College|Institute|School)\s+of\s+[A-Z][^\n,]*/gi,
      /[A-Z][^\n,]*(?:University|College|Institute|School)/gi
    ];
    
    for (const pattern of institutionPatterns) {
      const match = (beforeText + afterText).match(pattern);
      if (match) {
        return match[0];
      }
    }
    
    return 'Not specified';
  }

  static extractYear(text, position) {
    const surroundingText = text.substring(Math.max(0, position - 100), position + 100);
    const yearPattern = /\b(19|20)\d{2}\b/g;
    const years = surroundingText.match(yearPattern);
    
    if (years && years.length > 0) {
      return years.length > 1 ? `${years[0]}-${years[years.length - 1]}` : years[0];
    }
    
    return 'Not specified';
  }

  static extractCompany(text, position) {
    const surroundingText = text.substring(Math.max(0, position - 100), position + 200);
    const companyPatterns = [
      /(?:at|@)\s+([A-Z][^\n,]*(?:Inc|LLC|Corp|Company|Ltd|Technologies|Systems|Solutions))/gi,
      /(?:Company|Organization|Employer)[:\s]+([^\n]+)/gi
    ];
    
    for (const pattern of companyPatterns) {
      const match = surroundingText.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    
    return 'Not specified';
  }

  static extractDuration(text, position) {
    const surroundingText = text.substring(Math.max(0, position - 100), position + 100);
    const durationPatterns = [
      /\b(\d{1,2})\s+(?:years?|months?)\b/gi,
      /\b(19|20)\d{2}\s*[-–]\s*(19|20)\d{2}\b/g,
      /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+(19|20)\d{2}\s*[-–]\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+(19|20)\d{2}\b/gi
    ];
    
    for (const pattern of durationPatterns) {
      const match = surroundingText.match(pattern);
      if (match) {
        return match[0];
      }
    }
    
    return 'Not specified';
  }

  static extractJobDescription(text, position) {
    const afterText = text.substring(position, position + 300);
    const lines = afterText.split('\n').slice(1, 4); // Get next 3 lines
    
    return lines
      .filter(line => line.trim().length > 10)
      .join(' ')
      .substring(0, 200) || 'Not specified';
  }
}

export default PDFParserService;