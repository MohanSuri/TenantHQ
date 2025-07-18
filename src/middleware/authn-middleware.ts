import {Request, Response, NextFunction} from 'express';
import {InternalServerError, UnauthorizedError} from '@errors/custom-error';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

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

    if (!process.env.JWT_SECRET) {
        throw new InternalServerError('JWT_SECRET is not defined in the environment variables');
    }

    // `jwt.verify` throws if the token is invalid or expired — this is intentionally uncaught,
    // allowing global error-handling middleware to handle it.
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
    isValidJwtPayload(decoded); 
    
    req.user = {
        userId: decoded.userId,
        tenantId: decoded.tenantId,
        role: decoded.role
    }

    next();
}

const isValidJwtPayload = (decoded: any) => {
    if (!decoded.userId || typeof decoded.userId !== 'string' ||
        !decoded.tenantId || typeof decoded.tenantId !== 'string' ||
        !decoded.role || typeof decoded.role !== 'string'
    )
    throw new UnauthorizedError('Malformed token')
}