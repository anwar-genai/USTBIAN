import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { Resume } from './resume.entity';
import { CoverLetter } from './cover-letter.entity';

@Entity('job_applications')
export class JobApplication {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Resume, { nullable: true, onDelete: 'SET NULL' })
  resume: Resume;

  @Column({ nullable: true })
  resumeId: string;

  @ManyToOne(() => CoverLetter, { nullable: true, onDelete: 'SET NULL' })
  coverLetter: CoverLetter;

  @Column({ nullable: true })
  coverLetterId: string;

  // Job Details
  @Column()
  jobTitle: string;

  @Column()
  company: string;

  @Column({ nullable: true })
  jobUrl: string;

  @Column({ type: 'text', nullable: true })
  jobDescription: string;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  salary: string;

  // Application Status
  @Column({ default: 'draft' })
  status: 'draft' | 'applied' | 'interviewing' | 'offered' | 'rejected' | 'accepted' | 'withdrawn';

  @Column({ type: 'date', nullable: true })
  appliedDate: Date;

  @Column({ type: 'date', nullable: true })
  deadlineDate: Date;

  // Notes and tracking
  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'jsonb', default: [] })
  timeline: {
    date: Date;
    event: string;
    notes?: string;
  }[];

  @Column({ type: 'jsonb', default: [] })
  contacts: {
    name: string;
    email?: string;
    phone?: string;
    role?: string;
  }[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

