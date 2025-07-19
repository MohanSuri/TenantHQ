import { UserRepository } from '@repositories/user-repository';
import { IUser, UserRole } from '@models/user';
import logger from '@utils/logger';
import bcrypt from 'bcryptjs';

export class UserService {
    private static _instance: UserService;
    private static _userRepository: UserRepository
    tenantRepository: any;
    public static getInstance() {
        if (!UserService._instance) {
            UserService._instance = new UserService();
        }
        return UserService._instance;
    }
    private constructor() {
        UserService._userRepository = new UserRepository();
    }

    // This method assumes that the tenantId has been validated.
    public async createUser(userName: string, email: string, tenantId: string, role: UserRole = UserRole.USER, password?: string): Promise<any> {
        const userExists = await UserService._userRepository.doesUserExist(email);
        if (userExists) {
            logger.error('user email already exists', { email });
            throw new Error('user email already exists');
        }
        password = password?.trim() ?? 'password'
        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await UserService._userRepository.createUser(userName, email, hashedPassword, tenantId, role ?? UserRole.USER);
        logger.info('user created successfully', { result });
        return {email: email};
    }

    public async getUser(userId: string): Promise<IUser | null>{
        // Caching will be added later
        return await UserService._userRepository.getUserById(userId);
    }
}
