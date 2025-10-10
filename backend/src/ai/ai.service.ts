import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { GenerateTextDto } from './dto/generate-text.dto';
import { EnhanceTextDto } from './dto/enhance-text.dto';
import { ShortenTextDto } from './dto/shorten-text.dto';

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private openai: OpenAI | null = null;
  private readonly maxPostLength = 500;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    
    if (!apiKey) {
      this.logger.warn('OPENAI_API_KEY not found in environment variables. AI features will be disabled.');
    } else {
      this.openai = new OpenAI({
        apiKey: apiKey,
      });
      this.logger.log('OpenAI service initialized successfully');
    }
  }

  private ensureOpenAI(): void {
    if (!this.openai) {
      throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY in your environment variables.');
    }
  }

  /**
   * Generate post text from a prompt with multiple suggestions
   */
  async generateText(dto: GenerateTextDto): Promise<string[]> {
    this.ensureOpenAI();

    const maxLength = dto.maxLength || this.maxPostLength;
    
    try {
      this.logger.log(`Generating text from prompt: "${dto.prompt}"`);
      
      const completion = await this.openai!.chat.completions.create({
        model: 'gpt-4o-mini', // Using GPT-4o-mini as it's the latest efficient model
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant that generates engaging social media posts. 
Generate 3 different variations of a post based on the user's prompt. 
Each post must be under ${maxLength} characters.
Be creative, engaging, and appropriate for a university social network.
Return only the 3 posts separated by "---" (three dashes on a new line).
Do not include numbering or labels.`,
          },
          {
            role: 'user',
            content: dto.prompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 500,
      });

      const content = completion.choices[0]?.message?.content || '';
      const suggestions = content
        .split('---')
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && s.length <= maxLength)
        .slice(0, 3);

      if (suggestions.length === 0) {
        throw new Error('No valid suggestions generated');
      }

      this.logger.log(`Generated ${suggestions.length} suggestions`);
      return suggestions;
    } catch (error) {
      this.logger.error('Error generating text:', error);
      throw new Error('Failed to generate text. Please try again.');
    }
  }

  /**
   * Enhance existing text with improved grammar, clarity, and tone
   */
  async enhanceText(dto: EnhanceTextDto): Promise<string> {
    this.ensureOpenAI();

    const maxLength = dto.maxLength || this.maxPostLength;
    const toneInstruction = dto.tone 
      ? `Adjust the tone to be ${dto.tone}.` 
      : 'Maintain the original tone while improving clarity.';

    try {
      this.logger.log(`Enhancing text with tone: ${dto.tone || 'original'}`);
      
      const completion = await this.openai!.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a helpful writing assistant. Enhance the given text by:
- Fixing grammar and spelling errors
- Improving clarity and readability
- ${toneInstruction}
- Keeping it under ${maxLength} characters
- Preserving the core message and meaning

Return only the enhanced text without any explanations or labels.`,
          },
          {
            role: 'user',
            content: dto.text,
          },
        ],
        temperature: 0.7,
        max_tokens: 300,
      });

      const enhanced = completion.choices[0]?.message?.content?.trim() || dto.text;
      
      // Ensure it doesn't exceed max length
      if (enhanced.length > maxLength) {
        return enhanced.substring(0, maxLength - 3) + '...';
      }

      this.logger.log('Text enhanced successfully');
      return enhanced;
    } catch (error) {
      this.logger.error('Error enhancing text:', error);
      throw new Error('Failed to enhance text. Please try again.');
    }
  }

  /**
   * Shorten text to fit within target length while preserving meaning
   */
  async shortenText(dto: ShortenTextDto): Promise<string> {
    this.ensureOpenAI();

    try {
      this.logger.log(`Shortening text to ${dto.targetLength} characters`);
      
      const completion = await this.openai!.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant that shortens text while preserving its core message.
Shorten the given text to under ${dto.targetLength} characters.
Maintain the key points and tone.
Return only the shortened text without explanations.`,
          },
          {
            role: 'user',
            content: dto.text,
          },
        ],
        temperature: 0.5,
        max_tokens: 200,
      });

      const shortened = completion.choices[0]?.message?.content?.trim() || dto.text;
      
      // Final safety check
      if (shortened.length > dto.targetLength) {
        return shortened.substring(0, dto.targetLength - 3) + '...';
      }

      this.logger.log('Text shortened successfully');
      return shortened;
    } catch (error) {
      this.logger.error('Error shortening text:', error);
      throw new Error('Failed to shorten text. Please try again.');
    }
  }

  /**
   * Check if AI service is available
   */
  isAvailable(): boolean {
    return this.openai !== null;
  }

  /**
   * Generate resume content from user data
   */
  async generateResume(data: {
    targetRole: string;
    industry: string;
    skills?: string[];
    education?: any[];
    experience?: any[];
    projects?: string[];
    additionalInfo?: string;
    tone?: string;
  }): Promise<{
    summary: string;
    suggestedSkills: string[];
    experienceDescriptions: string[];
    projectDescriptions: string[];
  }> {
    this.ensureOpenAI();

    try {
      this.logger.log(`Generating resume content for role: ${data.targetRole}`);

      const prompt = `Generate professional resume content for the following:

Target Role: ${data.targetRole}
Industry: ${data.industry}
${data.skills?.length ? `Skills: ${data.skills.join(', ')}` : ''}
${data.education?.length ? `Education: ${JSON.stringify(data.education)}` : ''}
${data.experience?.length ? `Experience: ${JSON.stringify(data.experience)}` : ''}
${data.projects?.length ? `Projects: ${data.projects.join(', ')}` : ''}
${data.additionalInfo ? `Additional Info: ${data.additionalInfo}` : ''}

Tone: ${data.tone || 'professional'}

Generate:
1. A compelling professional summary (3-4 sentences)
2. 10 relevant technical and soft skills
3. Enhanced descriptions for experience items (if provided)
4. Enhanced descriptions for projects (if provided)

Return as JSON:
{
  "summary": "...",
  "suggestedSkills": ["skill1", "skill2", ...],
  "experienceDescriptions": ["desc1", "desc2", ...],
  "projectDescriptions": ["desc1", "desc2", ...]
}`;

      const completion = await this.openai!.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert resume writer and career coach. Generate compelling, ATS-friendly resume content. Return valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
      this.logger.log('Resume content generated successfully');
      return result;
    } catch (error) {
      this.logger.error('Error generating resume:', error);
      throw new Error('Failed to generate resume. Please try again.');
    }
  }

  /**
   * Analyze and optimize existing resume
   */
  async optimizeResume(resumeData: {
    summary?: string;
    experience?: any[];
    skills?: any[];
    education?: any[];
    projects?: any[];
    targetRole?: string;
    jobDescription?: string;
  }): Promise<{
    score: number;
    suggestions: {
      category: string;
      title: string;
      description: string;
      priority: 'low' | 'medium' | 'high';
    }[];
    improvedSummary?: string;
  }> {
    this.ensureOpenAI();

    try {
      this.logger.log('=== Starting Resume Optimization ===');
      this.logger.log('Resume data received:', {
        hasSummary: !!resumeData.summary,
        experienceCount: resumeData.experience?.length || 0,
        skillsCount: resumeData.skills?.length || 0,
        educationCount: resumeData.education?.length || 0,
        projectsCount: resumeData.projects?.length || 0,
        hasTargetRole: !!resumeData.targetRole,
        hasJobDescription: !!resumeData.jobDescription,
      });

      // Format data more carefully to avoid huge JSON strings
      const formatExperience = (exp: any[]) => {
        return exp.map(e => `${e.position || 'Position'} at ${e.company || 'Company'} (${e.startDate || 'Date'} - ${e.endDate || 'Present'})`).join('\n');
      };

      const formatSkills = (skills: any[]) => {
        return skills.map(s => typeof s === 'string' ? s : (s.name || 'Skill')).join(', ');
      };

      const formatEducation = (edu: any[]) => {
        return edu.map(e => `${e.degree || 'Degree'} in ${e.field || 'Field'} from ${e.school || 'School'}`).join('\n');
      };

      const prompt = `Analyze and optimize this resume:

${resumeData.summary ? `Summary:\n${resumeData.summary}\n` : 'No summary provided.\n'}

${resumeData.experience?.length ? `Experience:\n${formatExperience(resumeData.experience)}\n` : 'No experience listed.\n'}

${resumeData.skills?.length ? `Skills: ${formatSkills(resumeData.skills)}\n` : 'No skills listed.\n'}

${resumeData.education?.length ? `Education:\n${formatEducation(resumeData.education)}\n` : 'No education listed.\n'}

${resumeData.projects?.length ? `Projects: ${resumeData.projects.length} projects listed\n` : ''}

${resumeData.targetRole ? `Target Role: ${resumeData.targetRole}\n` : ''}

${resumeData.jobDescription ? `Job Description (for optimization): ${resumeData.jobDescription.substring(0, 500)}\n` : ''}

Provide:
1. An optimization score (0-100) based on ATS compatibility, keyword usage, and formatting
2. 3-5 specific actionable suggestions to improve the resume
3. An improved version of the summary if one exists (keep it under 150 words)

Return as JSON:
{
  "score": 75,
  "suggestions": [
    {
      "category": "Summary|Experience|Skills|Keywords|Formatting",
      "title": "Brief, clear title",
      "description": "Specific actionable advice",
      "priority": "high|medium|low"
    }
  ],
  "improvedSummary": "Enhanced summary text (optional)"
}`;

      this.logger.log('Sending request to OpenAI...');
      this.logger.log('Prompt length:', prompt.length);

      const completion = await this.openai!.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert ATS (Applicant Tracking System) specialist and resume optimizer with 10+ years of experience in recruiting and HR technology.

Your expertise includes:
- ATS keyword optimization and parsing
- Industry-standard resume formatting
- Quantifiable achievement highlighting
- Action verb usage and impact statements
- Skills matching and gap analysis

Provide specific, actionable feedback that will help resumes pass ATS scans and impress human recruiters. Focus on:
1. Keyword optimization for ATS parsing
2. Quantifiable achievements and metrics
3. Strong action verbs and active voice
4. Clear, scannable formatting
5. Industry-relevant skills and certifications

Return valid JSON only with practical, implementable suggestions. Always include a score and at least 3 suggestions.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.6,
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      });

      this.logger.log('Received response from OpenAI');
      const content = completion.choices[0]?.message?.content;
      this.logger.log('Response content length:', content?.length || 0);

      if (!content) {
        throw new Error('No content received from OpenAI');
      }

      const result = JSON.parse(content);
      this.logger.log(`Resume optimization complete - Score: ${result.score}, Suggestions: ${result.suggestions?.length || 0}`);
      
      // Ensure we have the required fields
      if (typeof result.score !== 'number') {
        this.logger.warn('Invalid score, defaulting to 50');
        result.score = 50;
      }
      
      if (!Array.isArray(result.suggestions)) {
        this.logger.warn('No suggestions array, creating default');
        result.suggestions = [{
          category: 'General',
          title: 'Review Required',
          description: 'Your resume needs further review and optimization.',
          priority: 'medium',
        }];
      }

      return result;
    } catch (error) {
      this.logger.error('=== ERROR Optimizing Resume ===');
      this.logger.error('Error type:', error.constructor?.name);
      this.logger.error('Error message:', error.message);
      this.logger.error('Error details:', error);
      
      // Provide more specific error messages
      if (error.message?.includes('API key')) {
        throw new Error('OpenAI API key is invalid or missing.');
      }
      
      if (error.message?.includes('rate limit')) {
        throw new Error('Rate limit exceeded. Please try again in a few moments.');
      }
      
      if (error.message?.includes('timeout')) {
        throw new Error('Request timed out. Please try again.');
      }
      
      throw new Error(`Failed to optimize resume: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Generate cover letter
   */
  async generateCoverLetter(data: {
    jobTitle: string;
    company: string;
    jobDescription: string;
    senderName: string;
    whyInterested?: string;
    relevantExperience?: string;
    keyStrengths?: string;
    resumeData?: any;
    tone?: string;
  }): Promise<string> {
    this.ensureOpenAI();

    try {
      this.logger.log(`Generating cover letter for ${data.jobTitle} at ${data.company}`);

      const prompt = `Write a compelling cover letter for:

Job Title: ${data.jobTitle}
Company: ${data.company}
Job Description: ${data.jobDescription}

Candidate: ${data.senderName}
${data.whyInterested ? `Why interested: ${data.whyInterested}` : ''}
${data.relevantExperience ? `Relevant experience: ${data.relevantExperience}` : ''}
${data.keyStrengths ? `Key strengths: ${data.keyStrengths}` : ''}
${data.resumeData ? `Resume data: ${JSON.stringify(data.resumeData)}` : ''}

Tone: ${data.tone || 'professional'}

Write a cover letter that:
- Opens with a strong, personalized hook
- Highlights relevant experience and achievements
- Shows genuine interest in the company
- Demonstrates knowledge of the role
- Closes with a clear call to action
- Is 250-400 words
- Uses confident, active language

Return only the cover letter body (no date, addresses, or signature block).`;

      const completion = await this.openai!.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert cover letter writer who creates compelling, personalized cover letters that get interviews. Write in a natural, confident tone.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      const coverLetter = completion.choices[0]?.message?.content?.trim() || '';
      this.logger.log('Cover letter generated successfully');
      return coverLetter;
    } catch (error) {
      this.logger.error('Error generating cover letter:', error);
      throw new Error('Failed to generate cover letter. Please try again.');
    }
  }

  /**
   * Parse uploaded resume text into structured data
   */
  async parseUploadedResume(resumeText: string): Promise<{
    fullName?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
    website?: string;
    summary?: string;
    experience?: any[];
    education?: any[];
    skills?: string[];
    certifications?: string[];
  }> {
    this.ensureOpenAI();

    try {
      this.logger.log('Parsing uploaded resume with AI...');

      const prompt = `Parse the following resume text and extract structured information.

Resume Text:
${resumeText.substring(0, 8000)} 

Extract and return as JSON:
{
  "fullName": "Full name of the person",
  "email": "Email address",
  "phone": "Phone number",
  "location": "City, State/Country",
  "linkedin": "LinkedIn URL if found",
  "github": "GitHub URL if found",
  "website": "Personal website URL if found",
  "summary": "Professional summary or objective (2-3 sentences)",
  "experience": [
    {
      "company": "Company name",
      "position": "Job title",
      "startDate": "Start date",
      "endDate": "End date or Present",
      "current": false,
      "description": "Brief description",
      "achievements": ["Achievement 1", "Achievement 2"]
    }
  ],
  "education": [
    {
      "school": "University/College name",
      "degree": "Degree type",
      "field": "Field of study",
      "startDate": "Start year",
      "endDate": "Graduation year",
      "gpa": "GPA if mentioned"
    }
  ],
  "skills": ["Skill 1", "Skill 2", ...],
  "certifications": ["Cert 1", "Cert 2", ...]
}

Important: Return valid JSON only. If a field is not found, omit it or use empty array.`;

      const completion = await this.openai!.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert resume parser. Extract structured information from resume text accurately. Return valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
      this.logger.log('Resume parsed successfully');
      return result;
    } catch (error) {
      this.logger.error('Error parsing resume:', error);
      throw new Error('Failed to parse resume. Please try again.');
    }
  }
}

