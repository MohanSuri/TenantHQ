export class CustomError extends Error {
    public statusCode;
    public details;
    constructor(message: string, statusCode = 500, details?: any){
        super(message);
        this.statusCode = statusCode;
        this.details = details
    }
}

export class InternalServerError extends CustomError {
    constructor(message = 'Internal Server Error', statusCode = 500, details?: any){
        super(message, statusCode, details);
    }
}

export class NotFoundError extends CustomError {
    constructor(message = 'Resource Not Found', statusCode = 404, details?: any){
        super(message, statusCode, details);
    }
}

export class UnauthorizedError extends CustomError {
    constructor(message = 'Unauthorized', statusCode = 401, details?: any){
        super(message, statusCode, details);
    }
}

export class BadRequestError extends CustomError {
    constructor(message = 'BadRequest', statusCode = 400, details?: any){
        super(message, statusCode, details);
    }
}

export class ConflictError extends CustomError {
    constructor(message = 'Conflict', statusCode = 409, details?: any){
        super(message, statusCode, details);
    }
}