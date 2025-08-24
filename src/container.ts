import {container} from 'tsyringe';
import {UserService} from '@/services/user-service';
import {UserRepository} from '@/repositories/user-repository';
import { TenantService } from './services/tenant-service';
import { TenantRepository } from './repositories/tenant-repository';
import { AuthService } from './services/auth-service';

container.register(UserService, {useClass: UserService});
container.register(UserRepository, {useClass: UserRepository});
container.register(TenantService, {useClass: TenantService});
container.register(TenantRepository, {useClass: TenantRepository});   
container.register(AuthService, {useClass: AuthService}); 

export { container };