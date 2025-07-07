import { UserRepository } from '../repositories/user-repository';
import { UserRole } from '../models/user';
import logger from '../utils/logger';
import bcrypt from 'bcryptjs';
import { TenantService } from './tenant-service';

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

    public async createUser(userName: string, email: string, domain: string, role: UserRole, password?: string): Promise<any> {
        const userExists = await UserService._userRepository.doesUserExist(email);
        if (userExists) {
            logger.error('user email already exists', { email });
            throw new Error('user email already exists');
        }
        password = password?.trim() ?? 'password'
        const hashedPassword = await bcrypt.hash(password, 10);

        // Convert tenantId to ObjectId if it's a valid ObjectId string
        const tenant = await TenantService.getInstance().getTenantByDomain(domain);

        if (!tenant) {
            logger.error(`Tenant with domain ${domain} does not exist`);
            throw new Error(`Tenant with domain ${domain} does not exist.`);
        }
        const result = await UserService._userRepository.createUser(userName, email, hashedPassword, tenant._id, role ?? UserRole.USER);
        logger.info('user created successfully', { result });
        return {userName: email, password};
    }
}
