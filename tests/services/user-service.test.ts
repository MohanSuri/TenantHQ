import { UserService } from '../../src/services/user-service';
import { UserRepository } from '../../src/repositories/user-repository';
import { UserRole } from '../../src/models/user';
import logger from '../../src/utils/logger';

// Mock the dependencies
jest.mock('../../src/repositories/UserRepository');
jest.mock('../../src/utils/logger');

const MockedUserRepository = UserRepository as jest.MockedClass<typeof UserRepository>;

describe('UserService', () => {
  let userService: UserService;
  let mockUserRepositoryInstance: jest.Mocked<UserRepository>;

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

    // Mock the constructor to return our mock instance
    (UserRepository as jest.MockedClass<typeof UserRepository>).mockImplementation(() => mockUserRepositoryInstance);

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
      domain: 'example.com',
      role: UserRole.USER,
      password: 'testpassword'
    };

    const mockCreatedUser = {
      _id: '507f1f77bcf86cd799439011',
      userName: 'testuser',
      email: 'test@example.com',
      password: 'hashedpassword',
      tenantId: '507f1f77bcf86cd799439012',
      role: 'user',
      createdAt: new Date()
    };

    it('should create a new user successfully with provided password', async () => {
      // Arrange
      mockUserRepositoryInstance.doesUserExist.mockResolvedValue(false);
      mockUserRepositoryInstance.createUser.mockResolvedValue(mockCreatedUser);

      // Act
      const result = await userService.createUser(
        mockUserData.userName,
        mockUserData.email,
        mockUserData.domain,
        mockUserData.role,
        mockUserData.password
      );

      // Assert
      expect(mockUserRepositoryInstance.doesUserExist).toHaveBeenCalledWith(mockUserData.email);
      expect(mockUserRepositoryInstance.createUser).toHaveBeenCalledWith(
        mockUserData.userName,
        mockUserData.email,
        mockUserData.password,
        mockUserData.domain,
        mockUserData.role
      );
      expect(result).toEqual(mockCreatedUser);
      expect(logger.info).toHaveBeenCalledWith('user created successfully', { result: mockCreatedUser });
    });

    it('should create a new user successfully with default password when not provided', async () => {
      // Arrange
      mockUserRepositoryInstance.doesUserExist.mockResolvedValue(false);
      mockUserRepositoryInstance.createUser.mockResolvedValue(mockCreatedUser);

      // Act
      const result = await userService.createUser(
        mockUserData.userName,
        mockUserData.email,
        mockUserData.domain,
        mockUserData.role
        // No password provided
      );

      // Assert
      expect(mockUserRepositoryInstance.doesUserExist).toHaveBeenCalledWith(mockUserData.email);
      expect(mockUserRepositoryInstance.createUser).toHaveBeenCalledWith(
        mockUserData.userName,
        mockUserData.email,
        'password', // Default password
        mockUserData.domain,
        mockUserData.role
      );
      expect(result).toEqual(mockCreatedUser);
    });

    it('should create an admin user successfully', async () => {
      // Arrange
      const adminUserData = { ...mockUserData, role: UserRole.ADMIN };
      mockUserRepositoryInstance.doesUserExist.mockResolvedValue(false);
      mockUserRepositoryInstance.createUser.mockResolvedValue({ ...mockCreatedUser, role: 'admin' });

      // Act
      const result = await userService.createUser(
        adminUserData.userName,
        adminUserData.email,
        adminUserData.domain,
        adminUserData.role,
        adminUserData.password
      );

      // Assert
      expect(mockUserRepositoryInstance.createUser).toHaveBeenCalledWith(
        adminUserData.userName,
        adminUserData.email,
        adminUserData.password,
        adminUserData.domain,
        adminUserData.role
      );
      expect(result.role).toBe('admin');
    });

    it('should throw error when user email already exists', async () => {
      // Arrange
      mockUserRepositoryInstance.doesUserExist.mockResolvedValue(true);

      // Act & Assert
      await expect(userService.createUser(
        mockUserData.userName,
        mockUserData.email,
        mockUserData.domain,
        mockUserData.role,
        mockUserData.password
      )).rejects.toThrow('user email already exists');

      expect(mockUserRepositoryInstance.doesUserExist).toHaveBeenCalledWith(mockUserData.email);
      expect(mockUserRepositoryInstance.createUser).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith('user email already exists', { email: mockUserData.email });
    });

    it('should handle repository errors during user creation', async () => {
      // Arrange
      const errorMessage = 'Database connection failed';
      mockUserRepositoryInstance.doesUserExist.mockResolvedValue(false);
      mockUserRepositoryInstance.createUser.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(userService.createUser(
        mockUserData.userName,
        mockUserData.email,
        mockUserData.domain,
        mockUserData.role,
        mockUserData.password
      )).rejects.toThrow(errorMessage);

      expect(mockUserRepositoryInstance.doesUserExist).toHaveBeenCalledWith(mockUserData.email);
      expect(mockUserRepositoryInstance.createUser).toHaveBeenCalledWith(
        mockUserData.userName,
        mockUserData.email,
        mockUserData.password,
        mockUserData.domain,
        mockUserData.role
      );
    });

    it('should handle repository errors during user existence check', async () => {
      // Arrange
      const errorMessage = 'Database connection failed';
      mockUserRepositoryInstance.doesUserExist.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(userService.createUser(
        mockUserData.userName,
        mockUserData.email,
        mockUserData.domain,
        mockUserData.role,
        mockUserData.password
      )).rejects.toThrow(errorMessage);

      expect(mockUserRepositoryInstance.doesUserExist).toHaveBeenCalledWith(mockUserData.email);
      expect(mockUserRepositoryInstance.createUser).not.toHaveBeenCalled();
    });

    it('should handle edge case with empty string password', async () => {
      // Arrange
      mockUserRepositoryInstance.doesUserExist.mockResolvedValue(false);
      mockUserRepositoryInstance.createUser.mockResolvedValue(mockCreatedUser);

      // Act
      const result = await userService.createUser(
        mockUserData.userName,
        mockUserData.email,
        mockUserData.domain,
        mockUserData.role,
        '' // Empty string password
      );

      // Assert - Empty string should be passed through since ?? only checks for null/undefined
      expect(mockUserRepositoryInstance.createUser).toHaveBeenCalledWith(
        mockUserData.userName,
        mockUserData.email,
        '', // Empty string password passed through
        mockUserData.domain,
        mockUserData.role
      );
      expect(result).toEqual(mockCreatedUser);
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
      const specialEmail = 'test+user@sub.example.com';
      const mockResult = {
        _id: '507f1f77bcf86cd799439011',
        userName: 'testuser',
        email: specialEmail,
        password: 'hashedpassword',
        tenantId: '507f1f77bcf86cd799439012',
        role: 'user',
        createdAt: new Date()
      };
      mockUserRepositoryInstance.doesUserExist.mockResolvedValue(false);
      mockUserRepositoryInstance.createUser.mockResolvedValue(mockResult);

      // Act
      const result = await userService.createUser(
        'testuser',
        specialEmail,
        'example.com',
        UserRole.USER,
        'password'
      );

      // Assert
      expect(mockUserRepositoryInstance.doesUserExist).toHaveBeenCalledWith(specialEmail);
      expect(result).toEqual(mockResult);
      expect(result.email).toBe(specialEmail);
    });

    it('should handle special characters in username', async () => {
      // Arrange
      const specialUsername = 'test-user_123';
      const mockResult = {
        _id: '507f1f77bcf86cd799439011',
        userName: specialUsername,
        email: 'test@example.com',
        password: 'hashedpassword',
        tenantId: '507f1f77bcf86cd799439012',
        role: 'user',
        createdAt: new Date()
      };
      mockUserRepositoryInstance.doesUserExist.mockResolvedValue(false);
      mockUserRepositoryInstance.createUser.mockResolvedValue(mockResult);

      // Act
      const result = await userService.createUser(
        specialUsername,
        'test@example.com',
        'example.com',
        UserRole.USER,
        'password'
      );

      // Assert
      expect(mockUserRepositoryInstance.createUser).toHaveBeenCalledWith(
        specialUsername,
        'test@example.com',
        'password',
        'example.com',
        UserRole.USER
      );
      expect(result).toEqual(mockResult);
      expect(result.userName).toBe(specialUsername);
    });
  });
});
