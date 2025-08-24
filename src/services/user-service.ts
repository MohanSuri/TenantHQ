import { UserRepository } from '@repositories/user-repository';
import { IUser, UserRole } from '@models/user';
import { ConflictError, ForbiddenError, NotFoundError } from '@errors/custom-error';
import logger from '@utils/logger';
import bcrypt from 'bcryptjs';
import { AuthenticatedUser } from '@/types/auth';
import mongoose from 'mongoose';
import { inject, singleton } from 'tsyringe';

@singleton()
export class UserService {
    constructor(@inject(UserRepository) private readonly userRepository: UserRepository) {
    }

    // This method assumes that the tenantId has been validated.
    public async createUser(userName: string, email: string, tenantId: string, role: UserRole = UserRole.USER, password?: string): Promise<any> {
        const userExists = await this.userRepository.doesUserExist(email);
        if (userExists) {
            logger.error('user email already exists', { email });
            throw new Error('user email already exists');
        }
        password = password?.trim() ?? 'password'
        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await this.userRepository.createUser(userName, email, hashedPassword, tenantId, role ?? UserRole.USER);
        logger.info('user created successfully', { result });
        return {email: email};
    }

    public async getUser(userId: string): Promise<IUser | null>{
        // Caching will be added later
        return await this.userRepository.getUserById(userId);
    }


    /**
     * Terminates a user within the same tenant.
     * 
     * Termination is a 2-step process:
     *   1. Someone requests a termination (user, manager, admin)
     *   2. Admin approves the termination
     * 
     * Security Constraints:
     *   - Same tenant
     *   - Not already terminated
     *   - Only admins can approve
     *   - Cannot terminate oneself
     *   - Cannot terminate the last active admin
     */
    public async terminateUser(userIdToBeTerminated: string, actor: AuthenticatedUser): Promise<void> {
        logger.info(`Terminate request for ${userIdToBeTerminated}`);
        const {userId: actorUserId, tenantId: actorTenantId, role: actorRole} = actor;
        
        // Basic role check - only admins can terminate users
        if (actorRole !== UserRole.ADMIN) {
            throw new ForbiddenError(`Only admins can terminate users`);
        }
        
        // Prevent self-termination to avoid accidental or malicious lockout
        if (actorUserId === userIdToBeTerminated) {
            throw new ForbiddenError(`Self termination is not allowed`);
        }
        
        //TODO: Check if the user has an outstanding termination request, will be done in subsequent PRs

        // Use transaction to ensure data consistency and prevent race conditions
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            // Fetch user within transaction to get consistent state
            const user = await this.userRepository.getUserById(userIdToBeTerminated, session);
            
            if (!user) throw new NotFoundError(`User ${userIdToBeTerminated} not found`);
            
            // Tenancy check - ensure user belongs to same tenant
            if (user.tenantId.toString() !== actorTenantId) {
                throw new ForbiddenError(`Cannot terminate users from different tenants`);
            }
            
            if (user.isTerminated) {
                throw new ConflictError(`User ${userIdToBeTerminated} is already terminated`);
            }
            
            // Re-verify actor permissions within transaction
            const dbActor = await this.userRepository.getUserById(actorUserId, session);
            if (!dbActor || dbActor.role !== UserRole.ADMIN) {
                throw new ForbiddenError(`Actor ${actorUserId} does not have admin privileges`);
            }
            
            // Prevent terminating the last admin
            if (user.role === UserRole.ADMIN) {
                const activeAdminCount = await this.userRepository.getActiveAdminCount(actorTenantId, session);
                if (activeAdminCount <= 1) {
                    throw new ForbiddenError(`Cannot terminate the last active admin`);
                }
            }
            
            await this.userRepository.terminateUser(
                user._id.toString(),
                actorUserId,
                actorTenantId,
                session);
            await session.commitTransaction();
        } catch (err) {
            await session.abortTransaction();
            throw err;
        } finally {
            session.endSession();
        }
    }
}
