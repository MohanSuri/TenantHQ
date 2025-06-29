import {UserRole, User} from '../models/User';
import bcrypt from 'bcryptjs';
import { TenantRepository } from './TenantRepository';
import logger from '../utils/logger';

export class UserRepository {
    private tenantRepository: TenantRepository;
    constructor() {
        this.tenantRepository = new TenantRepository();
    }
    async createUser(userName: string, email: string, password: string, tenantDomain: string, role?: UserRole): Promise<any> {
        // Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        // Convert tenantId to ObjectId if it's a valid ObjectId string
        const tenant = await this.tenantRepository.getTenantByDomain(tenantDomain);
        
        if (!tenant) {
            logger.error(`Tenant with domain ${tenantDomain} does not exist`);
            throw new Error(`Tenant with domain ${tenantDomain} does not exist.`);
        }
        const user = new User({ 
            userName, 
            email, 
            password: hashedPassword, 
            tenantId: tenant._id,
            role: role ?? UserRole.USER
        });
        try {
             await user.save();
        } catch (error: unknown) {
            throw new Error(`Failed to create ${email} user ${error}`);
        }
        logger.info(`Created user ${email} successfully`);
        return user;
    }

    async getUserByEmail(email: string): Promise<any> {
        return await User.findOne({ email });
    }
    
    async getUserById(userId: string): Promise<any> {
        return await User.findById(userId);
    }

    async doesUserExist(email: string): Promise<boolean> {
        logger.info('Checking if user exists for domain', { email });
        const user = await this.getUserByEmail(email);
        if (!user) {
            logger.info('User does not exist for email', { email });
            return false;
        }
        return true;
        }

    async getUsersByTenant(domain: string): Promise<any[]> {
        const tenant = await this.tenantRepository.getTenantByDomain(domain);
        return await User.find({ tenantId: tenant._id });
    }

    async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }
}