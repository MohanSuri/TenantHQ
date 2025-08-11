import {container} from 'tsyringe';
import {UserService} from '@/services/user-service';
import {UserRepository} from '@/repositories/user-repository';

container.register("UserService", {useClass: UserService});
container.register("UserRepository", {useClass: UserRepository});

export { container };