import {UserRole, User, IUser} from '@models/user';
import logger from '@utils/logger';

export class UserRepository {

    async createUser(userName: string, email: string, password: string, tenantId: any, role?: UserRole): Promise<any> {
        const user = new User({ 
            userName, 
            email, 
            password, 
            tenantId,
            role: role ?? UserRole.USER
        });
        await user.save();
        logger.info(`Created user ${email} successfully`);
        return user;
    }

    async getUserByEmail(email: string): Promise<any> {
        return await User.findOne({ email });
    }
    
    async getUserById(userId: string): Promise<IUser | null> {
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

    // async getUsersByTenant(domain: string): Promise<any[]> {
    //     //const tenant = await this.tenantRepository.getTenantByDomain(domain);
    //     return await User.find({ tenantId: tenant._id });
    // }

    // async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    //     return await bcrypt.compare(plainPassword, hashedPassword);
    // }
}