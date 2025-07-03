import { ConflictError, CustomError, InternalServerError } from "../errors/custom-error";
import { UserRole } from "../models/user";
import { TenantRepository } from "../repositories/tenant-repository";
import logger from "../utils/logger";
import { UserService } from "./user-service";
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
 
 public async createTenant(name: string, domain: string): Promise<any>{
    logger.info('Creating tenant', { name, domain });
    try {
      const doesTenantExist = await TenantService._tenantRepository.doesTenantExist(domain);
      if (doesTenantExist) {
          logger.error('Tenant already exists', { domain });
          throw new ConflictError(`Tenant ${domain}already exists`);
      }
    
      const tenant = await TenantService._tenantRepository.createTenant(name, domain);
      logger.info('Tenant created successfully', { tenant });
      const adminUser = await UserService.getInstance().createUser("admin", `admin@${domain}`, domain, UserRole.ADMIN);
      return adminUser;
    } catch (error) {
       if (error instanceof ConflictError) {
      throw error;
    }

    logger.error('Error creating tenant', { error });
    throw new InternalServerError("Failed to create tenant", 500, error);
    }
}

public async getAllTenants(): Promise<any[]> {
  logger.info('Fetching all tenants');
  try {
    const tenants = await TenantService._tenantRepository.getAllTenants();
    logger.info('Tenants fetched successfully', { count: tenants.length });
    return tenants;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    logger.error('Error fetching tenants', {
      message,
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw new InternalServerError('Error fetching tenants: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

public async getTenantByDomain(domain: string):  Promise<any>{
  try {
    const tenant = await TenantService._tenantRepository.getTenantByDomain(domain);
    logger.info(`${tenant ? 'Returning' : 'Failed to fetch' } Tenant by domain ${domain}`);
    return tenant;
  } catch (error: any) {
    logger.error(`Failed fetching tenant details ${error}`);
    throw new InternalServerError(error.message);
  }
}
}