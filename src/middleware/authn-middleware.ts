import {Request, Response, NextFunction} from 'express';
import {UnauthorizedError} from '@errors/custom-error';
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

    const token = authHeader.split(' ')[1];

    // jwt.verify will validate if the token is invalid or expired
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;    
    
    req.user = {
        userId: decoded.userId,
        tenantId: decoded.tenantId,
        role: decoded.role
    }

    next();
}