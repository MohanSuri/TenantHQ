import { Request, Response, NextFunction } from 'express';
import { AuthService } from '@services/auth-service';
import logger from '@utils/logger';
import { BadRequestError } from '@errors/custom-error';
import { container } from 'tsyringe';


export  const login = async (req: Request, res: Response) => {
    logger.info('User login initiated');
    const {email, password} = req.body;
    if (!email || !email.trim())
        throw new BadRequestError('Invalid Email. Please try again');
    if (!password || !password.trim())
        throw new BadRequestError('Invalid Password. Please try again');

    const result = await container.resolve<AuthService>('AuthService').login(email, password);
    logger.info('User login successful');
    res.status(200).json({result});
}