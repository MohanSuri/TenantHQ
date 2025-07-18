import {Request, Response, NextFunction} from 'express';
import {UnauthorizedError} from '@errors/custom-error';
import jwt from 'jsonwebtoken';
import { config } from '@config/config'
import { AuthTokenPayload } from '@/types/auth';

declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                tenantId: string;
                role: string;
            };
        }
    }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) throw new UnauthorizedError('Missing auth header');

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || !parts[1]) throw new UnauthorizedError('Invalid auth header format');
    const token = parts[1];

    // `jwt.verify` throws if the token is invalid or expired — this is intentionally uncaught,
    // allowing global error-handling middleware to handle it.
    const decoded = jwt.verify(token, config.JWT_SECRET) as AuthTokenPayload;
    validateJwtPayload(decoded); 
    
    req.user = {
        userId: decoded.userId,
        tenantId: decoded.tenantId,
        role: decoded.role
    }

    next();
}

const validateJwtPayload = (decoded: AuthTokenPayload) => {
    const missingFields: string[] = [];
    if (typeof decoded?.userId !== 'string')
        missingFields.push('userId');
    if (typeof decoded?.tenantId !== 'string')
        missingFields.push('tenantId');
    if ( typeof decoded?.role !== 'string')
        missingFields.push('role');
    
    if (missingFields.length)
        throw new UnauthorizedError(`Malformed token, missing ${missingFields.join(', ')}`)
}