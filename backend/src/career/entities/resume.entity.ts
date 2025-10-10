import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';

export interface Education {
  school: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  gpa?: string;
  achievements?: string[];
}

export interface Experience {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
  achievements: string[];
}

export interface Skill {
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  category?: string;
}

export interface Project {
  name: string;
  description: string;
  technologies: string[];
  url?: string;
  startDate?: string;
  endDate?: string;
}

@Entity('resumes')
export class Resume {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  userId: string;

  // Personal Information
  @Column({ type: 'varchar', nullable: true })
  fullName: string;

  @Column({ type: 'varchar', nullable: true })
  email: string;

  @Column({ type: 'varchar', nullable: true })
  phone: string;

  @Column({ type: 'varchar', nullable: true })
  location: string;

  @Column({ type: 'varchar', nullable: true })
  website: string;

  @Column({ type: 'varchar', nullable: true })
  linkedin: string;

  @Column({ type: 'varchar', nullable: true })
  github: string;

  // Professional Summary
  @Column({ type: 'text', nullable: true })
  summary: string;

  // Education
  @Column({ type: 'jsonb', default: [] })
  education: Education[];

  // Experience
  @Column({ type: 'jsonb', default: [] })
  experience: Experience[];

  // Skills
  @Column({ type: 'jsonb', default: [] })
  skills: Skill[];

  // Projects
  @Column({ type: 'jsonb', default: [] })
  projects: Project[];

  // Certifications
  @Column({ type: 'jsonb', default: [] })
  certifications: string[];

  // Languages
  @Column({ type: 'jsonb', default: [] })
  languages: { name: string; proficiency: string }[];

  // Optimization score (0-100)
  @Column({ type: 'int', default: 0 })
  optimizationScore: number;

  // AI-generated suggestions for improvement
  @Column({ type: 'jsonb', nullable: true })
  suggestions: {
    category: string;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
  }[];

  // Template/styling
  @Column({ default: 'modern' })
  template: string;

  @Column({ default: '#3B82F6' })
  accentColor: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

