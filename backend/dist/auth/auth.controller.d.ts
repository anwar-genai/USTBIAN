import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
export declare class AuthController {
    private readonly authService;
    private readonly usersService;
    constructor(authService: AuthService, usersService: UsersService);
    register(dto: CreateUserDto): Promise<{
        access_token: string;
    }>;
    login(req: any): Promise<{
        access_token: string;
    }>;
    me(req: any): Promise<{
        userId: any;
    }>;
}
