import { UserService } from '../../src/services/user-service';
import { UserRepository } from '../../src/repositories/user-repository';
import { TenantService } from '../../src/services/tenant-service';
import { UserRole } from '../../src/models/user';
import logger from '../../src/utils/logger';
import { mockTenantData } from '../__mocks__/test-data';

// Mock the dependencies
jest.mock('../../src/repositories/user-repository');
jest.mock('../../src/services/tenant-service');
jest.mock('../../src/utils/logger');

describe('UserService', () => {
  let userService: UserService;
  let mockUserRepositoryInstance: jest.Mocked<UserRepository>;
  let mockTenantServiceInstance: jest.Mocked<TenantService>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create mock instance
    mockUserRepositoryInstance = {
      createUser: jest.fn(),
      doesUserExist: jest.fn(),
      getUserByEmail: jest.fn(),
      getUserById: jest.fn(),
      getUsersByTenant: jest.fn(),
      verifyPassword: jest.fn(),
    } as any;

    mockTenantServiceInstance = {
      getTenantByDomain: jest.fn(),
    } as any;

    // Mock the constructor to return our mock instance
    (UserRepository as jest.MockedClass<typeof UserRepository>).mockImplementation(() => mockUserRepositoryInstance);
    
    // Mock TenantService.getInstance
    jest.spyOn(TenantService, 'getInstance').mockReturnValue(mockTenantServiceInstance);

    // Reset the singleton instance to get a fresh instance with mocked dependencies
    (UserService as any)._instance = undefined;
    userService = UserService.getInstance();
  });

  afterEach(() => {
    // Clean up singleton instance
    (UserService as any)._instance = undefined;
  });

  describe('createUser', () => {
    const mockUserData = {
      userName: 'testuser',
      email: 'test@example.com',
      domain: 'test.com', // Use mockTenantData.domain
      role: UserRole.USER,
      password: 'testpassword'
    };

    const mockCreatedUser = {
      _id: '507f1f77bcf86cd799439011',
      userName: 'testuser',
      email: 'test@example.com',
      password: 'hashedpassword',
      tenantId: '507f1f77bcf86cd799439011', // Use mockTenantData._id
      role: 'user',
      createdAt: new Date()
    };

    it('should create a new user successfully with provided password', async () => {
      // Arrange
      const mockTenant = mockTenantData as any;
      mockUserRepositoryInstance.doesUserExist.mockResolvedValue(false);
      mockUserRepositoryInstance.createUser.mockResolvedValue(mockCreatedUser);
      mockTenantServiceInstance.getTenantByDomain.mockResolvedValue(mockTenant);

      // Act - Use tenantId instead of domain
      const result = await userService.createUser(
        mockUserData.userName,
        mockUserData.email,
        mockTenant._id,
        mockUserData.role,
        mockUserData.password
      );

      // Assert - getTenantByDomain should not be called since we're passing tenantId directly
      expect(mockUserRepositoryInstance.doesUserExist).toHaveBeenCalledWith(mockUserData.email);
      expect(mockUserRepositoryInstance.createUser).toHaveBeenCalledWith(
        mockUserData.userName,
        mockUserData.email,
        expect.any(String), // hashedPassword
        mockTenant._id,
        mockUserData.role
      );
      expect(result).toEqual({ email: mockUserData.email }); // Updated return value
      expect(logger.info).toHaveBeenCalledWith('user created successfully', { result: mockCreatedUser });
    });

    it('should create a new user successfully with default password when not provided', async () => {
      // Arrange
      const mockTenant = mockTenantData as any;
      mockUserRepositoryInstance.doesUserExist.mockResolvedValue(false);
      mockUserRepositoryInstance.createUser.mockResolvedValue(mockCreatedUser);
      mockTenantServiceInstance.getTenantByDomain.mockResolvedValue(mockTenant);

      // Act - Use tenantId instead of domain
      const result = await userService.createUser(
        mockUserData.userName,
        mockUserData.email,
        mockTenant._id,
        mockUserData.role
        // No password provided
      );

      // Assert
      expect(mockUserRepositoryInstance.doesUserExist).toHaveBeenCalledWith(mockUserData.email);
      expect(mockUserRepositoryInstance.createUser).toHaveBeenCalledWith(
        mockUserData.userName,
        mockUserData.email,
        expect.any(String), // hashedPassword - default 'password' hashed
        mockTenant._id,
        mockUserData.role
      );
      expect(result).toEqual({ email: mockUserData.email }); // Updated return value
    });

    it('should create an admin user successfully', async () => {
      // Arrange
      const mockTenant = mockTenantData as any;
      const adminUserData = { ...mockUserData, role: UserRole.ADMIN };
      mockUserRepositoryInstance.doesUserExist.mockResolvedValue(false);
      mockUserRepositoryInstance.createUser.mockResolvedValue({ ...mockCreatedUser, role: 'admin' });
      mockTenantServiceInstance.getTenantByDomain.mockResolvedValue(mockTenant);

      // Act - Use tenantId instead of domain
      const result = await userService.createUser(
        adminUserData.userName,
        adminUserData.email,
        mockTenant._id,
        adminUserData.role,
        adminUserData.password
      );

      // Assert
      expect(mockUserRepositoryInstance.createUser).toHaveBeenCalledWith(
        adminUserData.userName,
        adminUserData.email,
        expect.any(String), // hashedPassword
        mockTenant._id,
        adminUserData.role
      );
      expect(result).toEqual({ email: adminUserData.email }); // Updated return value
    });

    it('should throw error when user email already exists', async () => {
      // Arrange
      mockUserRepositoryInstance.doesUserExist.mockResolvedValue(true);

      // Act & Assert - Use tenantId instead of domain
      await expect(userService.createUser(
        mockUserData.userName,
        mockUserData.email,
        mockTenantData._id,
        mockUserData.role,
        mockUserData.password
      )).rejects.toThrow('user email already exists');

      expect(mockUserRepositoryInstance.doesUserExist).toHaveBeenCalledWith(mockUserData.email);
      expect(mockUserRepositoryInstance.createUser).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith('user email already exists', { email: mockUserData.email });
    });

    it('should handle repository errors during user creation', async () => {
      // Arrange
      const mockTenant = mockTenantData as any;
      const errorMessage = 'Database connection failed';
      mockUserRepositoryInstance.doesUserExist.mockResolvedValue(false);
      mockUserRepositoryInstance.createUser.mockRejectedValue(new Error(errorMessage));
      mockTenantServiceInstance.getTenantByDomain.mockResolvedValue(mockTenant);

      // Act & Assert - Use tenantId instead of domain
      await expect(userService.createUser(
        mockUserData.userName,
        mockUserData.email,
        mockTenant._id,
        mockUserData.role,
        mockUserData.password
      )).rejects.toThrow(errorMessage);

      expect(mockUserRepositoryInstance.doesUserExist).toHaveBeenCalledWith(mockUserData.email);
      expect(mockUserRepositoryInstance.createUser).toHaveBeenCalledWith(
        mockUserData.userName,
        mockUserData.email,
        expect.any(String), // hashedPassword
        mockTenant._id,
        mockUserData.role
      );
    });

    it('should handle repository errors during user existence check', async () => {
      // Arrange
      const errorMessage = 'Database connection failed';
      mockUserRepositoryInstance.doesUserExist.mockRejectedValue(new Error(errorMessage));

      // Act & Assert - Use tenantId instead of domain
      await expect(userService.createUser(
        mockUserData.userName,
        mockUserData.email,
        mockTenantData._id,
        mockUserData.role,
        mockUserData.password
      )).rejects.toThrow(errorMessage);

      expect(mockUserRepositoryInstance.doesUserExist).toHaveBeenCalledWith(mockUserData.email);
      expect(mockUserRepositoryInstance.createUser).not.toHaveBeenCalled();
    });

    it('should handle edge case with empty string password', async () => {
      // Arrange
      const mockTenant = mockTenantData as any;
      mockUserRepositoryInstance.doesUserExist.mockResolvedValue(false);
      mockUserRepositoryInstance.createUser.mockResolvedValue(mockCreatedUser);
      mockTenantServiceInstance.getTenantByDomain.mockResolvedValue(mockTenant);

      // Act - Use tenantId instead of domain
      const result = await userService.createUser(
        mockUserData.userName,
        mockUserData.email,
        mockTenant._id,
        mockUserData.role,
        '' // Empty string password
      );

      // Assert - Empty string should be hashed since trim() on empty string is still empty, but not null/undefined
      expect(mockUserRepositoryInstance.doesUserExist).toHaveBeenCalledWith(mockUserData.email);
      expect(mockUserRepositoryInstance.createUser).toHaveBeenCalledWith(
        mockUserData.userName,
        mockUserData.email,
        expect.any(String), // Empty string gets hashed
        mockTenant._id,
        mockUserData.role
      );
      expect(result).toEqual({ email: mockUserData.email }); // Updated return value
    });
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance when called multiple times', () => {
      // Act
      const instance1 = UserService.getInstance();
      const instance2 = UserService.getInstance();

      // Assert
      expect(instance1).toBe(instance2);
      expect(instance1).toBeInstanceOf(UserService);
    });
  });

  describe('Edge Cases and Input Validation', () => {
    it('should handle special characters in email', async () => {
      // Arrange
      const mockTenant = mockTenantData as any;
      const specialEmail = 'test+user@sub.example.com';
      const mockResult = {
        _id: '507f1f77bcf86cd799439011',
        userName: 'testuser',
        email: specialEmail,
        password: 'hashedpassword',
        tenantId: '507f1f77bcf86cd799439011', // Use mockTenantData._id
        role: 'user',
        createdAt: new Date()
      };
      mockUserRepositoryInstance.doesUserExist.mockResolvedValue(false);
      mockUserRepositoryInstance.createUser.mockResolvedValue(mockResult);
      mockTenantServiceInstance.getTenantByDomain.mockResolvedValue(mockTenant);

      // Act - Use tenantId instead of domain
      const result = await userService.createUser(
        'testuser',
        specialEmail,
        mockTenant._id, // Use tenantId instead of domain
        UserRole.USER,
        'password'
      );

      // Assert
      expect(mockUserRepositoryInstance.doesUserExist).toHaveBeenCalledWith(specialEmail);
      expect(result).toEqual({ email: specialEmail }); // Updated return value
      expect(result.email).toBe(specialEmail);
    });

    it('should handle special characters in username', async () => {
      // Arrange
      const mockTenant = mockTenantData as any;
      const specialUsername = 'test-user_123';
      const mockResult = {
        _id: '507f1f77bcf86cd799439011',
        userName: specialUsername,
        email: 'test@example.com',
        password: 'hashedpassword',
        tenantId: '507f1f77bcf86cd799439011', // Use mockTenantData._id
        role: 'user',
        createdAt: new Date()
      };
      mockUserRepositoryInstance.doesUserExist.mockResolvedValue(false);
      mockUserRepositoryInstance.createUser.mockResolvedValue(mockResult);
      mockTenantServiceInstance.getTenantByDomain.mockResolvedValue(mockTenant);

      // Act - Use tenantId instead of domain
      const result = await userService.createUser(
        specialUsername,
        'test@example.com',
        mockTenant._id, // Use tenantId instead of domain
        UserRole.USER,
        'password'
      );

      // Assert
      expect(mockUserRepositoryInstance.createUser).toHaveBeenCalledWith(
        specialUsername,
        'test@example.com',
        expect.any(String), // hashedPassword
        mockTenant._id,
        UserRole.USER
      );
      expect(result).toEqual({ email: 'test@example.com' }); // Updated return value
      expect(result.email).toBe('test@example.com');
    });
  });
});
