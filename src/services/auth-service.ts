import { UserRepository } from '@repositories/user-repository';
import logger from '@utils/logger';
import bcrypt from 'bcryptjs';
import { InternalServerError, UnauthorizedError } from '@errors/custom-error';
import jwt from 'jsonwebtoken';
import { config } from '@/config/config';
import { AuthenticatedUser } from '@/types/auth';
import { RolePermissions } from '@/constants/permissions';
import { UserService } from './user-service';
import { IUser } from '@/models/user';
import { container } from '@/container';
import { inject, singleton } from "tsyringe";

@singleton()
export class AuthService {
    public constructor(@inject(UserRepository) private readonly userRepository: UserRepository) {
        // Instance methods do not require manual binding when using DI container
    }

    public async login(email: string, password: string): Promise<any> {
        logger.info(`Login attempt by ${email}`);
        const user = await this.userRepository.getUserByEmail(email);
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
            } as jwt.JwtPayload, 
            jwtSecret, 
            { expiresIn: jwtExpiry } as jwt.SignOptions
        );

        return token;
    }

    public async doesUserHavePermission(authenticatedUser: AuthenticatedUser, requiredPermission: string): Promise<void> {
        logger.info(`Checking for permissions of, ${authenticatedUser.userId}, ${requiredPermission}`);

        // Verify user account still exists and is active
        const userObj: IUser | null = await container.resolve<UserService>("UserService").getUser(authenticatedUser.userId);
        if (!userObj) {
            throw new UnauthorizedError('User account no longer exists');
        }

        // Use role from JWT for performance, but validate against DB role for security
        const jwtRole = authenticatedUser.role;
        const dbRole = userObj.role;
        
        if (jwtRole !== dbRole) {
            logger.warn(`Role mismatch for user ${authenticatedUser.userId}: JWT=${jwtRole}, DB=${dbRole}`);
            throw new UnauthorizedError('User role has changed, please re-authenticate');
        }

        const permissions = RolePermissions[jwtRole];
        if (!permissions) {
            throw new UnauthorizedError(`Unknown role: ${jwtRole}`);
        }
        
        const authorized = permissions.includes(requiredPermission);
        logger.info(`User ${authenticatedUser.userId}${authorized ? ' is authorized' : ' is not authorized'} for ${requiredPermission}`);
        
        if (!authorized) {
            throw new UnauthorizedError(`User does not have permission: ${requiredPermission}`);
        }
        // todo: will add resource also here to check for resource specific permissions in future
    }
}
