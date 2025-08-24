import { ConflictError, CustomError, InternalServerError } from "@errors/custom-error";
import { UserRole } from "@models/user";
import { TenantRepository } from "@repositories/tenant-repository";
import logger from "@utils/logger";
import { UserService } from "@services/user-service";
import { ITenant } from "@/models/tenant";
import { inject, singleton } from "tsyringe";

@singleton()
export class TenantService {
  public constructor(
    @inject(TenantRepository) private readonly tenantRepository: TenantRepository,
    @inject(UserService) private readonly userService: UserService
  ) {}

 public async createTenant(name: string, domain: string): Promise<ITenant>{
    logger.info('Creating tenant', { name, domain });
      const doesTenantExist = await this.tenantRepository.doesTenantExist(domain);
      if (doesTenantExist) {
          logger.error('Tenant already exists', { domain });
          throw new ConflictError(`Tenant ${domain} already exists`);
      }
    
      const tenant = await this.tenantRepository.createTenant(name, domain);
      logger.info('Tenant created successfully', { result: tenant });
      await this.userService.createUser("admin", `admin@${domain}`, tenant.id.toString(), UserRole.ADMIN);
      logger.info('Created admin user');
      return tenant;
}

public async getAllTenants(): Promise<ITenant[]> {
  logger.info('Fetching all tenants');
    const tenants = await this.tenantRepository.getAllTenants();
    logger.info('Tenants fetched successfully', { count: tenants.length });
    return tenants;
}

public async getTenantByDomain(domain: string):  Promise<ITenant>{
  const tenant = await this.tenantRepository.getTenantByDomain(domain);
  logger.info(`${tenant ? 'Returning' : 'Failed to fetch' } Tenant by domain ${domain}`);
  return tenant;
}

public async getTenantById(tenantId: string):  Promise<ITenant>{
  const tenant = await this.tenantRepository.getTenantById(tenantId);
  logger.info(`${tenant ? 'Returning' : 'Failed to fetch' } Tenant by id ${tenantId}`);
  return tenant;
}
}