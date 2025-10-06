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
exports.LikesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const like_entity_1 = require("./like.entity");
const post_entity_1 = require("../posts/post.entity");
const realtime_gateway_1 = require("../realtime/realtime.gateway");
let LikesService = class LikesService {
    likesRepository;
    postsRepository;
    realtime;
    constructor(likesRepository, postsRepository, realtime) {
        this.likesRepository = likesRepository;
        this.postsRepository = postsRepository;
        this.realtime = realtime;
    }
    async like(user, postId) {
        const post = await this.postsRepository.findOne({ where: { id: postId } });
        if (!post)
            throw new common_1.ConflictException('Post not found');
        const like = this.likesRepository.create({ user, post });
        try {
            await this.likesRepository.insert(like);
        }
        catch (e) {
            throw new common_1.ConflictException('Already liked');
        }
        this.realtime.emitLikeAdded(postId, user.id);
        return { success: true };
    }
    async unlike(user, postId) {
        const existing = await this.likesRepository.findOne({ where: { user: { id: user.id }, post: { id: postId } } });
        if (!existing)
            return { success: true };
        await this.likesRepository.remove(existing);
        this.realtime.emitLikeRemoved(postId, user.id);
        return { success: true };
    }
    async likeByUserId(userId, postId) {
        const user = { id: userId };
        return this.like(user, postId);
    }
    async unlikeByUserId(userId, postId) {
        const user = { id: userId };
        return this.unlike(user, postId);
    }
};
exports.LikesService = LikesService;
exports.LikesService = LikesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(like_entity_1.LikeEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(post_entity_1.PostEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        realtime_gateway_1.RealtimeGateway])
], LikesService);
//# sourceMappingURL=likes.service.js.map