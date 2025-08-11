import { ConflictError, CustomError, InternalServerError } from "@errors/custom-error";
import { UserRole } from "@models/user";
import { TenantRepository } from "@repositories/tenant-repository";
import logger from "@utils/logger";
import { UserService } from "@services/user-service";
import { ITenant } from "@/models/tenant";
import { container } from "@/container";
export class TenantService {
 private static _tenantRepository: TenantRepository;
 private static _instance: TenantService
 private constructor(){
    TenantService._tenantRepository = new TenantRepository();
  }
  public static getInstance(): TenantService {
    if (!TenantService._instance) {
        TenantService._instance = new TenantService();
    }
    return TenantService._instance;
  }
 
 public async createTenant(name: string, domain: string): Promise<ITenant>{
    logger.info('Creating tenant', { name, domain });
      const doesTenantExist = await TenantService._tenantRepository.doesTenantExist(domain);
      if (doesTenantExist) {
          logger.error('Tenant already exists', { domain });
          throw new ConflictError(`Tenant ${domain} already exists`);
      }
    
      const tenant = await TenantService._tenantRepository.createTenant(name, domain);
      logger.info('Tenant created successfully', { result: tenant });
      await container.resolve<UserService>("UserService").createUser("admin", `admin@${domain}`, tenant.id.toString(), UserRole.ADMIN);
      logger.info('Created admin user');
      return tenant;
}

public async getAllTenants(): Promise<ITenant[]> {
  logger.info('Fetching all tenants');
    const tenants = await TenantService._tenantRepository.getAllTenants();
    logger.info('Tenants fetched successfully', { count: tenants.length });
    return tenants;
}

public async getTenantByDomain(domain: string):  Promise<ITenant>{
  const tenant = await TenantService._tenantRepository.getTenantByDomain(domain);
  logger.info(`${tenant ? 'Returning' : 'Failed to fetch' } Tenant by domain ${domain}`);
  return tenant;
}

public async getTenantById(tenantId: string):  Promise<ITenant>{
  const tenant = await TenantService._tenantRepository.getTenantById(tenantId);
  logger.info(`${tenant ? 'Returning' : 'Failed to fetch' } Tenant by id ${tenantId}`);
  return tenant;
}
}