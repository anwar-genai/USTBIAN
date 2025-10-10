import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Resume } from './entities/resume.entity';
import { CoverLetter } from './entities/cover-letter.entity';
import { JobApplication } from './entities/job-application.entity';
import { CreateResumeDto } from './dto/create-resume.dto';
import { UpdateResumeDto } from './dto/update-resume.dto';
import { CreateCoverLetterDto } from './dto/create-cover-letter.dto';
import { UpdateCoverLetterDto } from './dto/update-cover-letter.dto';
import { GenerateResumeDto } from './dto/generate-resume.dto';
import { OptimizeResumeDto } from './dto/optimize-resume.dto';
import { GenerateCoverLetterDto } from './dto/generate-cover-letter.dto';
import { AIService } from '../ai/ai.service';
import { ResumeParserService } from './services/resume-parser.service';

@Injectable()
export class CareerService {
  constructor(
    @InjectRepository(Resume)
    private resumeRepository: Repository<Resume>,
    @InjectRepository(CoverLetter)
    private coverLetterRepository: Repository<CoverLetter>,
    @InjectRepository(JobApplication)
    private jobApplicationRepository: Repository<JobApplication>,
    private aiService: AIService,
    private resumeParserService: ResumeParserService,
  ) {}

  // ==================== RESUMES ====================

  async createResume(userId: string, dto: CreateResumeDto): Promise<Resume> {
    console.log('Creating resume for user:', userId);
    console.log('Resume data:', JSON.stringify(dto, null, 2));
    
    const resume = this.resumeRepository.create({
      ...dto,
      userId,
    });
    
    const saved = await this.resumeRepository.save(resume);
    console.log('Resume saved successfully:', saved.id);
    
    return saved;
  }

  async findAllResumes(userId: string): Promise<Resume[]> {
    return this.resumeRepository.find({
      where: { userId },
      order: { updatedAt: 'DESC' },
    });
  }

  async findOneResume(id: string, userId: string): Promise<Resume> {
    const resume = await this.resumeRepository.findOne({
      where: { id, userId },
    });
    if (!resume) {
      throw new NotFoundException('Resume not found');
    }
    return resume;
  }

  async updateResume(id: string, userId: string, dto: UpdateResumeDto): Promise<Resume> {
    const resume = await this.findOneResume(id, userId);
    Object.assign(resume, dto);
    return this.resumeRepository.save(resume);
  }

  async deleteResume(id: string, userId: string): Promise<void> {
    const resume = await this.findOneResume(id, userId);
    await this.resumeRepository.remove(resume);
  }

  async generateResume(userId: string, dto: GenerateResumeDto): Promise<any> {
    const aiResult = await this.aiService.generateResume({
      targetRole: dto.targetRole,
      industry: dto.industry,
      skills: dto.skills,
      education: dto.education,
      experience: dto.experience,
      projects: dto.projects,
      additionalInfo: dto.additionalInfo,
      tone: dto.tone,
    });

    return {
      summary: aiResult.summary,
      suggestedSkills: aiResult.suggestedSkills.map((skill) => ({
        name: skill,
        level: 'intermediate' as const,
        category: 'General',
      })),
      experienceDescriptions: aiResult.experienceDescriptions,
      projectDescriptions: aiResult.projectDescriptions,
    };
  }

  async optimizeResume(userId: string, dto: OptimizeResumeDto): Promise<any> {
    console.log('=== Optimize Resume Request ===');
    console.log('User ID:', userId);
    console.log('Resume ID:', dto.resumeId);
    console.log('Target Role:', dto.targetRole || 'None');
    console.log('Has Job Description:', !!dto.jobDescription);

    try {
      const resume = await this.findOneResume(dto.resumeId, userId);
      console.log('Resume found:', resume.id);
      console.log('Resume title:', resume.title);

      console.log('Calling AI service for optimization...');
      const optimization = await this.aiService.optimizeResume({
        summary: resume.summary,
        experience: resume.experience,
        skills: resume.skills,
        education: resume.education,
        projects: resume.projects,
        targetRole: dto.targetRole,
        jobDescription: dto.jobDescription,
      });

      console.log('Optimization complete - Score:', optimization.score);
      console.log('Suggestions count:', optimization.suggestions?.length || 0);

      // Update resume with optimization results
      resume.optimizationScore = optimization.score;
      resume.suggestions = optimization.suggestions;
      if (optimization.improvedSummary) {
        resume.summary = optimization.improvedSummary;
      }
      await this.resumeRepository.save(resume);

      console.log('Resume updated and saved successfully');
      return optimization;
    } catch (error) {
      console.error('=== ERROR in optimizeResume (Service) ===');
      console.error('Error type:', error.constructor?.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack?.substring(0, 500));
      throw error;
    }
  }

  /**
   * Optimize resume directly without saving to database first
   * Simplified approach - just calls AI service
   */
  async optimizeResumeDirect(resumeData: any): Promise<any> {
    console.log('=== Direct Optimization (Simplified) ===');
    console.log('Has Summary:', !!resumeData.summary);
    console.log('Experience Count:', resumeData.experience?.length || 0);
    console.log('Skills Count:', resumeData.skills?.length || 0);
    console.log('Education Count:', resumeData.education?.length || 0);

    try {
      // Call AI service directly with the data
      const optimization = await this.aiService.optimizeResume({
        summary: resumeData.summary,
        experience: resumeData.experience,
        skills: resumeData.skills,
        education: resumeData.education,
        projects: resumeData.projects,
        targetRole: resumeData.targetRole,
        jobDescription: resumeData.jobDescription,
      });

      console.log('Direct optimization complete - Score:', optimization.score);
      console.log('Suggestions count:', optimization.suggestions?.length || 0);

      return optimization;
    } catch (error) {
      console.error('=== ERROR in optimizeResumeDirect ===');
      console.error('Error type:', error.constructor?.name);
      console.error('Error message:', error.message);
      throw error;
    }
  }

  /**
   * Enhance resume with AI - auto-fill missing fields
   */
  async enhanceResume(id: string, userId: string): Promise<Resume> {
    console.log('=== Enhance Resume ===');
    console.log('Resume ID:', id);
    console.log('User ID:', userId);

    try {
      const resume = await this.findOneResume(id, userId);
      console.log('Resume found, enhancing with AI...');

      // Call AI service to enhance the resume
      const enhancements = await this.aiService.enhanceResume({
        fullName: resume.fullName,
        summary: resume.summary,
        experience: resume.experience,
        education: resume.education,
        skills: resume.skills,
        projects: resume.projects,
      });

      console.log('AI enhancements received');

      // Update resume with enhancements
      if (enhancements.improvedSummary && (!resume.summary || resume.summary.length < 50)) {
        resume.summary = enhancements.improvedSummary;
        console.log('✓ Summary enhanced');
      }

      if (enhancements.enhancedExperience && enhancements.enhancedExperience.length > 0) {
        // Merge enhanced descriptions with existing experience
        resume.experience = resume.experience?.map((exp, index) => {
          const enhanced = enhancements.enhancedExperience?.[index];
          return {
            ...exp,
            description: enhanced?.description || exp.description,
            achievements: enhanced?.achievements || exp.achievements,
          };
        }) || [];
        console.log('✓ Experience enhanced');
      }

      if (enhancements.suggestedSkills && enhancements.suggestedSkills.length > 0) {
        // Add suggested skills that don't already exist
        const existingSkillNames = resume.skills?.map(s => s.name.toLowerCase()) || [];
        const newSkills = enhancements.suggestedSkills
          .filter(skill => !existingSkillNames.includes(skill.toLowerCase()))
          .map(skill => ({
            name: skill,
            level: 'intermediate' as const,
            category: 'General',
          }));
        
        resume.skills = [...(resume.skills || []), ...newSkills];
        console.log(`✓ Added ${newSkills.length} new skills`);
      }

      if (enhancements.enhancedProjects && enhancements.enhancedProjects.length > 0) {
        resume.projects = resume.projects?.map((project, index) => {
          const enhanced = enhancements.enhancedProjects?.[index];
          return {
            ...project,
            description: enhanced?.description || project.description,
          };
        }) || [];
        console.log('✓ Projects enhanced');
      }

      // Save the enhanced resume
      await this.resumeRepository.save(resume);
      console.log('Enhanced resume saved successfully');

      return resume;
    } catch (error) {
      console.error('=== ERROR in enhanceResume ===');
      console.error('Error:', error.message);
      throw error;
    }
  }

  // ==================== COVER LETTERS ====================

  async createCoverLetter(userId: string, dto: CreateCoverLetterDto): Promise<CoverLetter> {
    const coverLetter = this.coverLetterRepository.create({
      ...dto,
      userId,
    });
    return this.coverLetterRepository.save(coverLetter);
  }

  async findAllCoverLetters(userId: string): Promise<CoverLetter[]> {
    return this.coverLetterRepository.find({
      where: { userId },
      order: { updatedAt: 'DESC' },
    });
  }

  async findOneCoverLetter(id: string, userId: string): Promise<CoverLetter> {
    const coverLetter = await this.coverLetterRepository.findOne({
      where: { id, userId },
    });
    if (!coverLetter) {
      throw new NotFoundException('Cover letter not found');
    }
    return coverLetter;
  }

  async updateCoverLetter(id: string, userId: string, dto: UpdateCoverLetterDto): Promise<CoverLetter> {
    const coverLetter = await this.findOneCoverLetter(id, userId);
    Object.assign(coverLetter, dto);
    return this.coverLetterRepository.save(coverLetter);
  }

  async deleteCoverLetter(id: string, userId: string): Promise<void> {
    const coverLetter = await this.findOneCoverLetter(id, userId);
    await this.coverLetterRepository.remove(coverLetter);
  }

  async generateCoverLetter(userId: string, dto: GenerateCoverLetterDto): Promise<{ content: string }> {
    let resumeData: any = null;
    if (dto.resumeId) {
      const resume = await this.findOneResume(dto.resumeId, userId);
      resumeData = {
        summary: resume.summary,
        experience: resume.experience,
        skills: resume.skills,
        education: resume.education,
      };
    }

    const content = await this.aiService.generateCoverLetter({
      jobTitle: dto.jobTitle,
      company: dto.company,
      jobDescription: dto.jobDescription,
      senderName: dto.senderName,
      whyInterested: dto.whyInterested,
      relevantExperience: dto.relevantExperience,
      keyStrengths: dto.keyStrengths,
      resumeData,
      tone: dto.tone,
    });

    return { content };
  }

  // ==================== JOB APPLICATIONS ====================

  async getCareerStats(userId: string): Promise<any> {
    const [resumes, coverLetters, applications] = await Promise.all([
      this.resumeRepository.count({ where: { userId } }),
      this.coverLetterRepository.count({ where: { userId } }),
      this.jobApplicationRepository.find({ where: { userId } }),
    ]);

    const applicationsByStatus = applications.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const averageOptimizationScore = await this.resumeRepository
      .createQueryBuilder('resume')
      .where('resume.userId = :userId', { userId })
      .select('AVG(resume.optimizationScore)', 'avg')
      .getRawOne();

    return {
      totalResumes: resumes,
      totalCoverLetters: coverLetters,
      totalApplications: applications.length,
      applicationsByStatus,
      averageOptimizationScore: Math.round(averageOptimizationScore?.avg || 0),
      recentActivity: [
        ...applications.slice(0, 5).map(app => ({
          type: 'application',
          title: app.jobTitle,
          company: app.company,
          date: app.updatedAt,
        })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    };
  }

  // ==================== RESUME UPLOAD & PARSING ====================

  async parseUploadedResume(userId: string, file: Express.Multer.File): Promise<any> {
    if (!file) {
      throw new Error('No file uploaded');
    }

    console.log('=== Resume Upload Debug ===');
    console.log('File name:', file.originalname);
    console.log('File size:', file.size, 'bytes');
    console.log('File type:', file.mimetype);
    console.log('Buffer size:', file.buffer?.length, 'bytes');

    let extractedText = '';
    let parsedData: any = null;
    let parsingSuccess = false;

    try {
      // Extract text from file
      console.log('Step 1: Extracting text from file...');
      
      try {
        extractedText = await this.resumeParserService.extractText(file.buffer, file.mimetype);
        console.log('Step 2: Text extracted successfully');
        console.log('Extracted text length:', extractedText?.length || 0);
        
        if (extractedText && extractedText.trim().length > 0) {
          console.log('First 200 chars:', extractedText.substring(0, 200));
        }
      } catch (extractError) {
        console.error('Text extraction failed:', extractError.message);
        // Continue anyway - we'll return empty data for manual entry
      }
      
      // Only try AI parsing if we have text
      if (extractedText && extractedText.trim().length >= 20) {
        try {
          console.log('Step 3: Parsing with AI...');
          parsedData = await this.aiService.parseUploadedResume(extractedText);
          
          console.log('Step 4: AI parsing successful');
          console.log('Parsed data keys:', Object.keys(parsedData || {}));
          parsingSuccess = true;
        } catch (aiError) {
          console.error('AI parsing failed:', aiError.message);
          // Continue anyway - we'll return the raw text
        }
      } else {
        console.log('Step 3: SKIPPED - Not enough text extracted, returning empty template for manual entry');
      }

      // Convert skills array to skill objects
      const skills = parsedData?.skills?.map((skillName) => ({
        name: skillName,
        level: 'intermediate' as const,
        category: 'General',
      })) || [];

      console.log('Step 5: Returning result (success:', parsingSuccess, ')');
      
      // Return parsed data or empty template for manual entry
      return {
        fullName: parsedData?.fullName || '',
        email: parsedData?.email || '',
        phone: parsedData?.phone || '',
        location: parsedData?.location || '',
        linkedin: parsedData?.linkedin || '',
        github: parsedData?.github || '',
        website: parsedData?.website || '',
        summary: parsedData?.summary || '',
        experience: parsedData?.experience || [],
        education: parsedData?.education || [],
        skills: skills,
        certifications: parsedData?.certifications || [],
        rawText: extractedText,
        parsingSuccess, // Let frontend know if parsing worked
        fileName: file.originalname,
      };
    } catch (error) {
      console.error('=== UNEXPECTED ERROR in parseUploadedResume ===');
      console.error('Error type:', error.constructor?.name);
      console.error('Error message:', error.message);
      
      // Only throw for critical errors
      if (error.message?.includes('OpenAI API key')) {
        throw new Error('AI service is not configured. Please contact support.');
      }
      
      // For other errors, return empty template
      console.log('Returning empty template due to error');
      return {
        fullName: '',
        email: '',
        phone: '',
        location: '',
        summary: '',
        experience: [],
        education: [],
        skills: [],
        rawText: extractedText || '',
        parsingSuccess: false,
        fileName: file.originalname,
        error: 'Could not parse PDF automatically. Please enter your information manually.',
      };
    }
  }
}

