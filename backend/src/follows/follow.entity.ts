import { CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('follows')
@Unique(['follower', 'following'])
export class FollowEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  follower: User;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  following: User;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}

