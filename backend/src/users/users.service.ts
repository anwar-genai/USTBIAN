import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(createDto: CreateUserDto): Promise<User> {
    const passwordHash = await bcrypt.hash(createDto.password, 12);
    const user = this.usersRepository.create({
      email: createDto.email,
      username: createDto.username,
      displayName: createDto.displayName,
      bio: createDto.bio,
      passwordHash,
    });
    return await this.usersRepository.save(user);
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.usersRepository.findOne({ where: { email } });
  }

  async findByUsername(username: string): Promise<User | null> {
    return await this.usersRepository.findOne({ where: { username } });
  }

  async update(id: string, updateDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    Object.assign(user, updateDto);
    return await this.usersRepository.save(user);
  }

  async search(query: string, limit: number = 20): Promise<User[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }
    
    // Search by username or display name (case-insensitive)
    return await this.usersRepository
      .createQueryBuilder('user')
      .where('LOWER(user.username) LIKE LOWER(:query)', { query: `%${query}%` })
      .orWhere('LOWER(user.displayName) LIKE LOWER(:query)', { query: `%${query}%` })
      .take(limit)
      .getMany();
  }
}


