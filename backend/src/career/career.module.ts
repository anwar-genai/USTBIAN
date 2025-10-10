import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CareerService } from './career.service';
import { CareerController } from './career.controller';
import { Resume } from './entities/resume.entity';
import { CoverLetter } from './entities/cover-letter.entity';
import { JobApplication } from './entities/job-application.entity';
import { AIModule } from '../ai/ai.module';
import { ResumeParserService } from './services/resume-parser.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Resume, CoverLetter, JobApplication]),
    AIModule,
  ],
  controllers: [CareerController],
  providers: [CareerService, ResumeParserService],
  exports: [CareerService],
})
export class CareerModule {}

