import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PostEntity } from '../posts/post.entity';
import { User } from '../users/user.entity';

@Entity('comments')
export class CommentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => PostEntity, { onDelete: 'CASCADE' })
  @Index()
  post: PostEntity;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  author: User;

  @ManyToOne(() => CommentEntity, (c) => c.children, { nullable: true, onDelete: 'CASCADE' })
  parent?: CommentEntity | null;

  @OneToMany(() => CommentEntity, (c) => c.parent)
  children: CommentEntity[];

  @Column({ type: 'varchar', length: 500 })
  content: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}


