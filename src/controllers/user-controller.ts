import { BadRequestError, NotFoundError } from '@/errors/custom-error';
import { ITenant } from '@/models/tenant';
import { TenantService } from '@/services/tenant-service';
import { UserService } from '@/services/user-service';
import { CreateUserPayloadSchema } from '@/types/user';
import logger from '@/utils/logger';
import { Request, Response } from 'express';
import { container } from '@/container';

export const createUser = async(req: Request, res: Response) => {
    logger.info('Received request to create new user');
    
    const parsed = CreateUserPayloadSchema.safeParse(req.body);
    if (!parsed.success) {
        logger.error(`Invalid input data: ${parsed.error.message}`);
        throw new BadRequestError(`Invalid input data ${parsed.error.message}`);
    }

    const { userName, alias, password, role } = parsed.data;

    const tenantId = req.user!.tenantId;
    const tenant: ITenant = await container.resolve<TenantService>('TenantService').getTenantById(tenantId);
    if (!tenant) throw new NotFoundError(`Tenant ${tenantId} not found`);
    
    const email = `${alias}@${tenant.domain}`;
    
    const result = await container.resolve<UserService>("UserService").createUser(userName,  email, tenant.id.toString(), role, password);
    res.status(201).json({ message: "User created successfully", result });
}

export const getUser = async(req: Request, res: Response) => {
    const { id } = req.params;
    res.status(200).json({ message: `Getting user with ID: ${id}` });
}

export const getUsers = async(req: Request, res: Response) => {
    res.status(200).json({ message: "Getting all users" });
}

export const updateUser = async(req: Request, res:Response) => {
    const { id } = req.params;
    res.status(200).json({ message: `Updating user with ID: ${id}` });
}

export const terminateUser = async(req: Request, res:Response) => {
    const { id } = req.params;
    await container.resolve<UserService>("UserService").terminateUser(id, req.user!);
    res.status(200).json({ message: `Terminating user with ID: ${id}` });
}