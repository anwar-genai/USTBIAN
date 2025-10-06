import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
export declare class AuthService {
    private readonly usersService;
    private readonly jwtService;
    constructor(usersService: UsersService, jwtService: JwtService);
    validateUser(email: string, password: string): Promise<import("../users/user.entity").User | null>;
    login(userId: string): Promise<{
        access_token: string;
    }>;
    authenticate(email: string, password: string): Promise<{
        access_token: string;
    }>;
}
