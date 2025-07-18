import { UserRepository } from '@repositories/user-repository';
import logger from '@utils/logger';
import bcrypt from 'bcryptjs';
import { InternalServerError, UnauthorizedError } from '@errors/custom-error';
import jwt from 'jsonwebtoken';
import { config } from '@/config/config';

export class AuthService {
    private static _instance: AuthService;
    private static _userRepository: UserRepository;

    public static getInstance() {
        if (!AuthService._instance) {
            AuthService._instance = new AuthService();
        }
        return AuthService._instance;
    }

    private constructor() {
        AuthService._userRepository = new UserRepository();
    }

    public async login(email: string, password: string): Promise<any> {
        logger.info(`Login attempt by ${email}`);
        const user = await AuthService._userRepository.getUserByEmail(email);
        if (!user) throw new UnauthorizedError(`User ${email} doesn't exist`);

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) throw new UnauthorizedError('Invalid username/password');
        
        const jwtSecret = config.JWT_SECRET;
        const jwtExpiry = config.JWT_EXPIRY;
        if (!jwtSecret || !jwtExpiry) throw new InternalServerError('Environment is not configured');
        
        const token = jwt.sign(
            {
                userId: user._id.toString(),
                tenantId: user.tenantId.toString(),
                role: user.role,
                email: user.email
            } as jwt.JwtPayload, 
            jwtSecret, 
            { expiresIn: jwtExpiry } as jwt.SignOptions
        );

        return token;
    }
}
