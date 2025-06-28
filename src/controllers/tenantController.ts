
import { Request, RequestHandler, Response } from 'express';
import { TenantService } from '../services/tenantService';
import logger from '../utils/logger';
/* 
Example of req body
{
    "name": "Tenant Name",
    "domain": "tenant-domain.com"
 }*/
export const createTenant = async (req: Request, res: Response) => {
    try {
        logger.info('Received request to create tenant', { body: req.body });
        const { name, domain } = req.body;

        if (!name || !domain || typeof name !== 'string' || typeof domain !== 'string') {
            logger.error('Invalid input data', { name, domain });
             res.status(400).json({ error: 'Invalid input data' });
             return;
        }

        const result = await TenantService.getInstance().createTenant(name, domain);

         res.status(201).json({
            message: 'Tenant created successfully',
            result
        });
        return;
    } catch (error) {
        logger.error('Error creating tenant', { error: error instanceof Error ? error.message : 'Unknown error' });
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getAllTenants = async (req: Request, res: Response) => {
    try {
        const tenants = await TenantService.getInstance().getAllTenants();
        res.status(200).json({
            message: 'Tenants fetched successfully',
            tenants
        });
    }
    catch (error) {
        logger.error('Error fetching tenants', { error: error instanceof Error ? error.message : 'Unknown error' });
        res.status(500).json({ error: 'Internal server error' });
    }
}
