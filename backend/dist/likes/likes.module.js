"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LikesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const likes_service_1 = require("./likes.service");
const likes_controller_1 = require("./likes.controller");
const like_entity_1 = require("./like.entity");
const post_entity_1 = require("../posts/post.entity");
const users_module_1 = require("../users/users.module");
const realtime_module_1 = require("../realtime/realtime.module");
let LikesModule = class LikesModule {
};
exports.LikesModule = LikesModule;
exports.LikesModule = LikesModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([like_entity_1.LikeEntity, post_entity_1.PostEntity]), users_module_1.UsersModule, realtime_module_1.RealtimeModule],
        providers: [likes_service_1.LikesService],
        controllers: [likes_controller_1.LikesController],
    })
], LikesModule);
//# sourceMappingURL=likes.module.js.map