import { CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { User } from '../users/user.entity';
import { PostEntity } from '../posts/post.entity';

@Entity('saved_posts')
@Unique(['user', 'post'])
export class SavedPostEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => PostEntity, { eager: true, onDelete: 'CASCADE' })
  post: PostEntity;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}

