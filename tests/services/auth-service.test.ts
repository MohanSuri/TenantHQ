import { AuthService } from '../../src/services/auth-service';
import { UserRepository } from '../../src/repositories/user-repository';
import { UserService } from '../../src/services/user-service';
import { UnauthorizedError, InternalServerError } from '../../src/errors/custom-error';
import { IUser, UserRole } from '../../src/models/user';
import { AuthenticatedUser } from '../../src/types/auth';
import { RolePermissions } from '../../src/constants/permissions';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../../src/config/config';
import { container } from '../../src/container';
import logger from '../../src/utils/logger';

// Mock dependencies
jest.mock('../../src/repositories/user-repository');
jest.mock('../../src/services/user-service');
jest.mock('../../src/utils/logger');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('../../src/config/config');

const MockedUserRepository = UserRepository as jest.MockedClass<typeof UserRepository>;

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserRepositoryInstance: jest.Mocked<UserRepository>;
  let mockUserServiceInstance: jest.Mocked<UserService>;

  const mockUser = {
    _id: '507f1f77bcf86cd799439012',
    userName: 'testuser',
    email: 'test@example.com',
    password: 'hashedpassword',
    tenantId: '507f1f77bcf86cd799439011',
    role: UserRole.USER,
    createdAt: new Date('2023-01-01T00:00:00.000Z'),
    toString: () => '507f1f77bcf86cd799439012'
  } as unknown as IUser; // Cast through unknown to match interface

  const mockAdminUser = {
    _id: '507f1f77bcf86cd799439013',
    userName: 'admin',
    email: 'admin@test.com',
    password: 'hashedpassword',
    tenantId: '507f1f77bcf86cd799439011',
    role: UserRole.ADMIN,
    createdAt: new Date('2023-01-01T00:00:00.000Z'),
    toString: () => '507f1f77bcf86cd799439013'
  } as unknown as IUser; // Cast through unknown to match interface

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock UserRepository instance
    mockUserRepositoryInstance = {
      createUser: jest.fn(),
      doesUserExist: jest.fn(),
      getUserByEmail: jest.fn(),
      getUserById: jest.fn(),
      getUsersByTenant: jest.fn(),
      verifyPassword: jest.fn(),
    } as any;

    // Mock UserService instance
    mockUserServiceInstance = {
      getUser: jest.fn(),
      createUser: jest.fn(),
    } as any;

    // Mock config
    (config as any).JWT_SECRET = 'test-secret';
    (config as any).JWT_EXPIRY = '1h';
  });

  afterEach(() => {
    (AuthService as any)._instance = undefined;
    container.reset();
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      // Arrange
      mockUserRepositoryInstance.getUserByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('mock-jwt-token');

  // Act
  const authService = new AuthService(mockUserRepositoryInstance, mockUserServiceInstance);
  const result = await authService.login('test@example.com', 'password');

      // Assert
      expect(result).toBe('mock-jwt-token');
      expect(mockUserRepositoryInstance.getUserByEmail).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('password', 'hashedpassword');
      expect(jwt.sign).toHaveBeenCalledWith(
        {
          userId: (mockUser._id as unknown as string).toString(),
          tenantId: (mockUser.tenantId as unknown as string).toString(),
          role: mockUser.role,
        },
        'test-secret',
        { expiresIn: '1h' }
      );
    });

    it('should throw UnauthorizedError when user does not exist', async () => {
      // Arrange
      mockUserRepositoryInstance.getUserByEmail.mockResolvedValue(null);

      // Act & Assert
      const authService = new AuthService(mockUserRepositoryInstance, mockUserServiceInstance);
      await expect(authService.login('nonexistent@example.com', 'password'))
        .rejects.toThrow(new UnauthorizedError('User nonexistent@example.com doesn\'t exist'));
    });

    it('should throw UnauthorizedError when password is incorrect', async () => {
      // Arrange
      mockUserRepositoryInstance.getUserByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act & Assert
      const authService = new AuthService(mockUserRepositoryInstance, mockUserServiceInstance);
      await expect(authService.login('test@example.com', 'wrongpassword'))
        .rejects.toThrow(new UnauthorizedError('Invalid username/password'));
    });

    it('should throw InternalServerError when JWT_SECRET is not configured', async () => {
      // Arrange
      mockUserRepositoryInstance.getUserByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (config as any).JWT_SECRET = undefined;

      // Act & Assert
      const authService = new AuthService(mockUserRepositoryInstance, mockUserServiceInstance);
      await expect(authService.login('test@example.com', 'password'))
        .rejects.toThrow(new InternalServerError('Environment is not configured'));
    });
  });

  describe('doesUserHavePermission', () => {
    const authenticatedUser: AuthenticatedUser = {
      userId: '507f1f77bcf86cd799439012',
      tenantId: '507f1f77bcf86cd799439011',
      role: 'USER'
    };

    const authenticatedAdmin: AuthenticatedUser = {
      userId: '507f1f77bcf86cd799439013',
      tenantId: '507f1f77bcf86cd799439011',
      role: 'ADMIN'
    };

    it('should not throw when user has required permission', async () => {
      // Arrange
      mockUserServiceInstance.getUser.mockResolvedValue({ ...mockAdminUser, role: UserRole.ADMIN } as IUser);
      const adminAuth = { ...authenticatedAdmin, role: 'ADMIN' };
      const authService = new AuthService(mockUserRepositoryInstance, mockUserServiceInstance);

      // Act & Assert - should not throw
      await expect(authService.doesUserHavePermission(adminAuth, 'user:create'))
        .resolves.not.toThrow();
      
      expect(mockUserServiceInstance.getUser).toHaveBeenCalledWith(adminAuth.userId);
      expect(logger.info).toHaveBeenCalledWith(`Checking for permissions of, ${adminAuth.userId}, user:create`);
      expect(logger.info).toHaveBeenCalledWith(`User ${adminAuth.userId} is authorized for user:create`);
    });

    it('should throw UnauthorizedError when user account no longer exists', async () => {
      // Arrange
      mockUserServiceInstance.getUser.mockResolvedValue(null);
      const authService = new AuthService(mockUserRepositoryInstance, mockUserServiceInstance);

      // Act & Assert
      await expect(authService.doesUserHavePermission(authenticatedUser, 'user:create'))
        .rejects.toThrow(new UnauthorizedError('User account no longer exists'));
      
      expect(mockUserServiceInstance.getUser).toHaveBeenCalledWith(authenticatedUser.userId);
    });

    it('should throw UnauthorizedError when JWT role does not match DB role', async () => {
      // Arrange
      // Simulate user with different role
      mockUserServiceInstance.getUser.mockResolvedValue({ ...mockUser, role: UserRole.ADMIN } as IUser);
      const authService = new AuthService(mockUserRepositoryInstance, mockUserServiceInstance);

      // Act & Assert
      await expect(authService.doesUserHavePermission(authenticatedUser, 'user:create'))
        .rejects.toThrow(new UnauthorizedError('User role has changed, please re-authenticate'));
      
      expect(logger.warn).toHaveBeenCalledWith(
        `Role mismatch for user ${authenticatedUser.userId}: JWT=USER, DB=ADMIN`
      );
    });

    it('should throw UnauthorizedError for unknown role', async () => {
      // Arrange
      // Simulate user with unknown role
      mockUserServiceInstance.getUser.mockResolvedValue({ ...mockUser, role: 'UNKNOWN_ROLE' as UserRole } as IUser);
      const authWithUnknownRole = { ...authenticatedUser, role: 'UNKNOWN_ROLE' };
      const authService = new AuthService(mockUserRepositoryInstance, mockUserServiceInstance);

      // Act & Assert
      await expect(authService.doesUserHavePermission(authWithUnknownRole, 'user:create'))
        .rejects.toThrow(new UnauthorizedError('Unknown role: UNKNOWN_ROLE'));
    });

    it('should throw UnauthorizedError when user lacks required permission', async () => {
      // Arrange
      // Simulate user with USER role and no permissions
      mockUserServiceInstance.getUser.mockResolvedValue({ ...mockUser, role: UserRole.USER, permissions: [] } as unknown as IUser);
      const authService = new AuthService(mockUserRepositoryInstance, mockUserServiceInstance);

      // Act & Assert
      await expect(authService.doesUserHavePermission(authenticatedUser, 'user:create'))
        .rejects.toThrow(new UnauthorizedError('User does not have permission: user:create'));
      
      expect(logger.info).toHaveBeenCalledWith(`User ${authenticatedUser.userId} is not authorized for user:create`);
    });

    it('should handle USER role with empty permissions array', async () => {
      // Arrange
      // Simulate user with USER role and empty permissions
      mockUserServiceInstance.getUser.mockResolvedValue({ ...mockUser, role: UserRole.USER, permissions: [] } as unknown as IUser);
      const authService = new AuthService(mockUserRepositoryInstance, mockUserServiceInstance);

      // Act & Assert
      await expect(authService.doesUserHavePermission(authenticatedUser, 'any:permission'))
        .rejects.toThrow(new UnauthorizedError('User does not have permission: any:permission'));
      
      // Verify USER role has empty permissions in RolePermissions
      expect(RolePermissions['USER']).toEqual([]);
    });

    it('should not throw when admin user has multiple permissions', async () => {
      // Arrange
      // Simulate admin user with all permissions
      mockUserServiceInstance.getUser.mockResolvedValue({ ...mockAdminUser, role: UserRole.ADMIN, permissions: ['user:create', 'user:update', 'user:get', 'user:terminate'] } as unknown as IUser);
      const authService = new AuthService(mockUserRepositoryInstance, mockUserServiceInstance);

      // Test multiple admin permissions
      const adminPermissions = ['user:create', 'user:update', 'user:get', 'user:terminate'];
      
      for (const permission of adminPermissions) {
        // Act & Assert - should not throw
        await expect(authService.doesUserHavePermission(authenticatedAdmin, permission))
          .resolves.not.toThrow();
      }
    });

    it('should throw UnauthorizedError when getUser throws an error', async () => {
      // Arrange
      mockUserServiceInstance.getUser.mockRejectedValue(new Error('Database error'));
      const authService = new AuthService(mockUserRepositoryInstance, mockUserServiceInstance);

      // Act & Assert
      await expect(authService.doesUserHavePermission(authenticatedUser, 'user:create'))
        .rejects.toThrow('Database error');
    });

    it('should handle role validation correctly with matching roles', async () => {
      // Arrange
      // Simulate user with matching role but no permission
      mockUserServiceInstance.getUser.mockResolvedValue({ ...mockUser, role: UserRole.USER, permissions: [] } as unknown as IUser);
      const authService = new AuthService(mockUserRepositoryInstance, mockUserServiceInstance);

      // Act & Assert - This should pass role validation but fail permission check
      await expect(authService.doesUserHavePermission(authenticatedUser, 'nonexistent:permission'))
        .rejects.toThrow(new UnauthorizedError('User does not have permission: nonexistent:permission'));
      
      // Verify no role mismatch warning was logged
      expect(logger.warn).not.toHaveBeenCalled();
    });
  });
});
