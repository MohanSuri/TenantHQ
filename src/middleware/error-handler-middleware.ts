import {Request, Response, NextFunction} from 'express'

export const errorHandler = (err: any,req: Request, res: Response, next: NextFunction) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    const result = {
        error: message
    }
    res.status(statusCode).json(result); 
}
