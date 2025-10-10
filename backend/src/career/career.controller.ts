import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CareerService } from './career.service';
import { CreateResumeDto } from './dto/create-resume.dto';
import { UpdateResumeDto } from './dto/update-resume.dto';
import { CreateCoverLetterDto } from './dto/create-cover-letter.dto';
import { UpdateCoverLetterDto } from './dto/update-cover-letter.dto';
import { GenerateResumeDto } from './dto/generate-resume.dto';
import { OptimizeResumeDto } from './dto/optimize-resume.dto';
import { GenerateCoverLetterDto } from './dto/generate-cover-letter.dto';

@Controller('career')
@UseGuards(JwtAuthGuard)
export class CareerController {
  constructor(private readonly careerService: CareerService) {}

  // ==================== DASHBOARD ====================

  @Get('stats')
  getStats(@Request() req) {
    return this.careerService.getCareerStats(req.user.userId);
  }

  // ==================== RESUMES ====================

  @Post('resumes')
  createResume(@Request() req, @Body() dto: CreateResumeDto) {
    return this.careerService.createResume(req.user.userId, dto);
  }

  @Get('resumes')
  findAllResumes(@Request() req) {
    return this.careerService.findAllResumes(req.user.userId);
  }

  @Get('resumes/:id')
  findOneResume(@Request() req, @Param('id') id: string) {
    return this.careerService.findOneResume(id, req.user.userId);
  }

  @Put('resumes/:id')
  updateResume(@Request() req, @Param('id') id: string, @Body() dto: UpdateResumeDto) {
    return this.careerService.updateResume(id, req.user.userId, dto);
  }

  @Delete('resumes/:id')
  deleteResume(@Request() req, @Param('id') id: string) {
    return this.careerService.deleteResume(id, req.user.userId);
  }

  @Post('resumes/generate')
  generateResume(@Request() req, @Body() dto: GenerateResumeDto) {
    return this.careerService.generateResume(req.user.userId, dto);
  }

  @Post('resumes/optimize')
  optimizeResume(@Request() req, @Body() dto: OptimizeResumeDto) {
    return this.careerService.optimizeResume(req.user.userId, dto);
  }

  @Post('resumes/optimize-direct')
  async optimizeResumeDirect(@Request() req, @Body() resumeData: any) {
    console.log('=== Direct Optimization (No DB Save) ===');
    console.log('User ID:', req.user.userId);
    
    try {
      // Call AI service directly without saving to database first
      return await this.careerService.optimizeResumeDirect(resumeData);
    } catch (error) {
      console.error('Direct optimization error:', error);
      throw new HttpException(
        error.message || 'Failed to optimize resume',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('resumes/:id/enhance')
  async enhanceResume(@Request() req, @Param('id') id: string) {
    console.log('=== Enhance Resume ===');
    console.log('User ID:', req.user.userId);
    console.log('Resume ID:', id);
    
    try {
      return await this.careerService.enhanceResume(id, req.user.userId);
    } catch (error) {
      console.error('Enhancement error:', error);
      throw new HttpException(
        error.message || 'Failed to enhance resume',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // ==================== COVER LETTERS ====================

  @Post('cover-letters')
  createCoverLetter(@Request() req, @Body() dto: CreateCoverLetterDto) {
    return this.careerService.createCoverLetter(req.user.userId, dto);
  }

  @Get('cover-letters')
  findAllCoverLetters(@Request() req) {
    return this.careerService.findAllCoverLetters(req.user.userId);
  }

  @Get('cover-letters/:id')
  findOneCoverLetter(@Request() req, @Param('id') id: string) {
    return this.careerService.findOneCoverLetter(id, req.user.userId);
  }

  @Put('cover-letters/:id')
  updateCoverLetter(@Request() req, @Param('id') id: string, @Body() dto: UpdateCoverLetterDto) {
    return this.careerService.updateCoverLetter(id, req.user.userId, dto);
  }

  @Delete('cover-letters/:id')
  deleteCoverLetter(@Request() req, @Param('id') id: string) {
    return this.careerService.deleteCoverLetter(id, req.user.userId);
  }

  @Post('cover-letters/generate')
  generateCoverLetter(@Request() req, @Body() dto: GenerateCoverLetterDto) {
    return this.careerService.generateCoverLetter(req.user.userId, dto);
  }

  // ==================== RESUME UPLOAD ====================

  @Post('resumes/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
      fileFilter: (req, file, cb) => {
        const allowedMimes = [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/msword',
        ];
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type. Only PDF and DOCX files are allowed.'), false);
        }
      },
    }),
  )
  async uploadResume(@Request() req, @UploadedFile() file: Express.Multer.File) {
    try {
      return await this.careerService.parseUploadedResume(req.user.userId, file);
    } catch (error) {
      console.error('Upload error in controller:', error);
      throw new HttpException(
        error.message || 'Failed to upload and parse resume',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}

