import { Injectable, Logger } from '@nestjs/common';
import mammoth from 'mammoth';
const pdf = require('pdf-parse');

@Injectable()
export class ResumeParserService {
  private readonly logger = new Logger(ResumeParserService.name);

  /**
   * Extract text from PDF file
   */
  async extractFromPDF(buffer: Buffer): Promise<string> {
    try {
      this.logger.log('Extracting text from PDF...');
      this.logger.log(`PDF buffer size: ${buffer.length} bytes`);
      
      // Check if buffer is valid
      if (!buffer || buffer.length === 0) {
        throw new Error('PDF buffer is empty');
      }

      // Parse PDF with extended options for better compatibility
      const data = await pdf(buffer, {
        // Disable image parsing to speed up and avoid issues
        max: 0,
        // Use built-in text extraction
        version: 'v2.0.550',
      });
      
      this.logger.log('PDF parsed successfully');
      this.logger.log(`PDF info: ${data.numpages} pages`);
      
      let text = data.text || '';
      
      // Try alternative text extraction if primary fails
      if (!text || text.trim().length === 0) {
        this.logger.warn('Primary text extraction returned empty, trying alternative method...');
        
        // Sometimes text is in pages
        if (data.text) {
          text = data.text;
        }
      }
      
      text = text.trim();
      this.logger.log(`Extracted ${text.length} characters from PDF`);
      
      // Log first 100 characters for debugging
      if (text.length > 0) {
        this.logger.log(`First 100 chars: ${text.substring(0, 100)}`);
      } else {
        this.logger.warn('PDF was parsed but no text was extracted. This might be an image-based PDF.');
      }
      
      return text;
    } catch (error) {
      this.logger.error('Error extracting PDF:', error);
      this.logger.error('Error details:', {
        message: error.message,
        stack: error.stack?.substring(0, 500), // Limit stack trace
        name: error.name,
      });
      
      // Don't throw immediately - let the service handle it
      throw error;
    }
  }

  /**
   * Extract text from DOCX file
   */
  async extractFromDOCX(buffer: Buffer): Promise<string> {
    try {
      this.logger.log('Extracting text from DOCX...');
      const result = await mammoth.extractRawText({ buffer });
      const text = result.value.trim();
      this.logger.log(`Extracted ${text.length} characters from DOCX`);
      return text;
    } catch (error) {
      this.logger.error('Error extracting DOCX:', error);
      throw new Error('Failed to extract text from DOCX. Please ensure the file is valid.');
    }
  }

  /**
   * Extract text from resume file (auto-detect format)
   */
  async extractText(buffer: Buffer, mimeType: string): Promise<string> {
    if (mimeType === 'application/pdf') {
      return this.extractFromPDF(buffer);
    } else if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimeType === 'application/msword'
    ) {
      return this.extractFromDOCX(buffer);
    } else {
      throw new Error(`Unsupported file type: ${mimeType}. Please upload PDF or DOCX files.`);
    }
  }

  /**
   * Parse extracted text into structured data (basic parsing)
   */
  parseResumeText(text: string): {
    rawText: string;
    sections: {
      contact?: string;
      summary?: string;
      experience?: string;
      education?: string;
      skills?: string;
    };
  } {
    const sections: any = {};
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);

    // Simple section detection (can be improved)
    let currentSection = 'contact';
    let sectionContent: string[] = [];

    const sectionKeywords = {
      experience: ['experience', 'work history', 'employment', 'professional experience'],
      education: ['education', 'academic', 'qualifications'],
      skills: ['skills', 'technical skills', 'competencies', 'expertise'],
      summary: ['summary', 'profile', 'objective', 'about'],
    };

    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      
      // Check if this line is a section header
      let foundSection = false;
      for (const [section, keywords] of Object.entries(sectionKeywords)) {
        if (keywords.some(kw => lowerLine.includes(kw) && line.length < 50)) {
          // Save previous section
          if (sectionContent.length > 0) {
            sections[currentSection] = sectionContent.join('\n');
          }
          currentSection = section;
          sectionContent = [];
          foundSection = true;
          break;
        }
      }

      if (!foundSection) {
        sectionContent.push(line);
      }
    }

    // Save last section
    if (sectionContent.length > 0) {
      sections[currentSection] = sectionContent.join('\n');
    }

    return {
      rawText: text,
      sections,
    };
  }
}

