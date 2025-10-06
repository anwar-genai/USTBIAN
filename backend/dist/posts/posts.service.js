"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const post_entity_1 = require("./post.entity");
const user_entity_1 = require("../users/user.entity");
let PostsService = class PostsService {
    postsRepository;
    usersRepository;
    constructor(postsRepository, usersRepository) {
        this.postsRepository = postsRepository;
        this.usersRepository = usersRepository;
    }
    async create(author, dto) {
        const post = this.postsRepository.create({ author, content: dto.content, mediaUrls: dto.mediaUrls });
        return await this.postsRepository.save(post);
    }
    async createByUserId(userId, dto) {
        const author = await this.usersRepository.findOne({ where: { id: userId } });
        if (!author)
            throw new common_1.NotFoundException('User not found');
        return this.create(author, dto);
    }
    async findById(id) {
        const post = await this.postsRepository.findOne({ where: { id } });
        if (!post)
            throw new common_1.NotFoundException('Post not found');
        return post;
    }
    async listRecent(limit = 20) {
        return await this.postsRepository.find({ order: { createdAt: 'DESC' }, take: limit });
    }
    async update(authorId, id, dto) {
        const post = await this.findById(id);
        if (post.author.id !== authorId)
            throw new common_1.UnauthorizedException('Not the author');
        Object.assign(post, dto);
        return await this.postsRepository.save(post);
    }
    async remove(authorId, id) {
        const post = await this.findById(id);
        if (post.author.id !== authorId)
            throw new common_1.UnauthorizedException('Not the author');
        await this.postsRepository.remove(post);
    }
};
exports.PostsService = PostsService;
exports.PostsService = PostsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(post_entity_1.PostEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], PostsService);
//# sourceMappingURL=posts.service.js.map