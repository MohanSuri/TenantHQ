import { BadRequestError } from '@/errors/custom-error';
import {UserRole, User, IUser} from '@models/user';
import logger from '@utils/logger';
import mongoose from 'mongoose';
import {injectable} from "tsyringe";

@injectable()
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
    
    /*
     * Returns leanUser for a given id */
    async getUserById(userId: string, session?: mongoose.ClientSession): Promise<IUser | null> {
        if (session) return await User.findById(new mongoose.Types.ObjectId(userId)).lean().session(session);
        
        return await User.findById(new mongoose.Types.ObjectId(userId)).lean();
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

    async getActiveAdminCount(tenantId: string, session: mongoose.ClientSession): Promise<number> {
        return await User.countDocuments({ 
            tenantId: new mongoose.Types.ObjectId(tenantId), 
            role: UserRole.ADMIN, 
            isTerminated: { $ne: true } 
        }).session(session);
    }

    async terminateUser(userId: string, approvedBy: string, tenantId: string, session: mongoose.ClientSession): Promise<any> {
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw new BadRequestError('Invalid user ID');
        }
        
        if (!mongoose.Types.ObjectId.isValid(tenantId)) {
            throw new BadRequestError('Invalid tenant ID');
        }
        
        if (!mongoose.Types.ObjectId.isValid(approvedBy)) {
            throw new BadRequestError('Invalid approvedBy ID');
        }
        
        return await User.updateOne({ _id: new mongoose.Types.ObjectId(userId), isTerminated: { $ne: true }, tenantId: new mongoose.Types.ObjectId(tenantId)}, {
            isTerminated: true,
            terminationDetails: {
                terminationDate: new Date(),
                approvedBy: new mongoose.Types.ObjectId(approvedBy),
            }
        }).session(session);
    }
}