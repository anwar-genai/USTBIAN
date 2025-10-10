import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';

@Entity('cover_letters')
export class CoverLetter {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  userId: string;

  // Job Information
  @Column()
  jobTitle: string;

  @Column()
  company: string;

  @Column({ nullable: true })
  jobDescription: string;

  // Letter Content
  @Column({ type: 'text' })
  content: string;

  // Personal Information (can be different from resume)
  @Column()
  senderName: string;

  @Column()
  senderEmail: string;

  @Column({ nullable: true })
  senderPhone: string;

  @Column({ nullable: true })
  senderAddress: string;

  // Recipient Information
  @Column({ nullable: true })
  recipientName: string;

  @Column({ nullable: true })
  recipientTitle: string;

  @Column({ nullable: true })
  companyAddress: string;

  // Metadata
  @Column({ type: 'date', nullable: true })
  dateWritten: Date;

  @Column({ default: 'professional' })
  tone: string;

  @Column({ type: 'jsonb', nullable: true })
  keyPoints: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

