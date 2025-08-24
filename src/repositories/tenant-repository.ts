import {Tenant} from '@models/tenant';
import logger from '@utils/logger';
import { singleton } from 'tsyringe';

@singleton()
export class TenantRepository {
    async createTenant(name:string, domain: string): Promise<any> {
        const tenant = new Tenant({ name, domain });
        try {
            await tenant.save();
            logger.info('Tenant created successfully', { tenant });
            return tenant;
        } catch (error) {
            logger.error('Error creating tenant', { error: error instanceof Error ? error.message : 'Unknown error' });
            throw new Error('Error creating tenant: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
    }

    async getTenantByDomain(domain: string): Promise<any>{
        return await Tenant.findOne().where('domain').equals(domain).exec();
    }

    async doesTenantExist(domain: string): Promise<boolean> {
        logger.info('Checking if tenant exists for domain', { domain });
        const tenant = await this.getTenantByDomain(domain);
        if (!tenant) {
            logger.info('Tenant does not exist for domain', { domain });
            return false;
        }
        return tenant !== null;
    }

    async getAllTenants(): Promise<any[]> {
        return await Tenant.find({});
    }

    async getTenantById(tenantId: string): Promise<any> {
        return await Tenant.findById(tenantId); 
    }
}