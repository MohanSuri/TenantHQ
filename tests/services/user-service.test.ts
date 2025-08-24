import { UserService } from '../../src/services/user-service';
import { UserRepository } from '../../src/repositories/user-repository';
import { TenantService } from '../../src/services/tenant-service';
import { UserRole } from '../../src/models/user';
import logger from '../../src/utils/logger';
import { mockTenantData, mockUserData, mockAdminUser, mockAuthenticatedAdmin, mockAuthenticatedUser } from '../__mocks__/test-data';
import { ForbiddenError, NotFoundError, ConflictError } from '../../src/errors/custom-error';
import mongoose from 'mongoose';
import { container } from '../../src/container';

// Mock the dependencies
jest.mock('../../src/repositories/user-repository');
jest.mock('../../src/services/tenant-service');
jest.mock('../../src/utils/logger');
jest.mock('mongoose');

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
      getActiveAdminCount: jest.fn(),
      terminateUser: jest.fn(),
    } as any;

    mockTenantServiceInstance = {
      getTenantByDomain: jest.fn(),
    } as any;

    // Directly instantiate UserService with mocked UserRepository
    userService = new UserService(mockUserRepositoryInstance);
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
  // Singleton Pattern test removed as it's not needed for direct instantiation unit tests
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

  describe('terminateUser', () => {
    let mockSession: any;

    beforeEach(() => {
      // Mock mongoose session
      mockSession = {
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        endSession: jest.fn(),
      };
      
      (mongoose.startSession as jest.Mock).mockResolvedValue(mockSession);
    });

    const mockRegularUser = {
      _id: { toString: () => '507f1f77bcf86cd799439014' },
      userName: 'regularuser',
      email: 'user@test.com',
      password: 'hashedpassword',
      tenantId: { toString: () => '507f1f77bcf86cd799439011' },
      role: UserRole.USER,
      isTerminated: false,
      createdAt: new Date('2023-01-01T00:00:00.000Z'),
    } as any; // Cast as any to avoid Document interface complexity

    const mockTerminatedUser = {
      ...mockRegularUser,
      isTerminated: true,
      terminationDetails: {
        approvedBy: { toString: () => '507f1f77bcf86cd799439013' },
        terminationDate: new Date('2023-01-02T00:00:00.000Z'),
      },
    } as any;

    const mockAdminUserForTermination = {
      _id: { toString: () => '507f1f77bcf86cd799439015' },
      userName: 'adminuser',
      email: 'admin2@test.com',
      password: 'hashedpassword',
      tenantId: { toString: () => '507f1f77bcf86cd799439011' },
      role: UserRole.ADMIN,
      isTerminated: false,
      createdAt: new Date('2023-01-01T00:00:00.000Z'),
    } as any;

    const mockDifferentTenantUser = {
      ...mockRegularUser,
      tenantId: { toString: () => '507f1f77bcf86cd799439022' }, // Different tenant
    } as any;

    it('should successfully terminate a regular user as admin', async () => {
      // Arrange
      mockUserRepositoryInstance.getUserById
        .mockResolvedValueOnce(mockRegularUser) // Target user
        .mockResolvedValueOnce(mockAdminUser); // Actor verification
      mockUserRepositoryInstance.terminateUser.mockResolvedValue({ modifiedCount: 1 });

      // Act
      await userService.terminateUser(mockRegularUser._id.toString(), mockAuthenticatedAdmin);

      // Assert
      expect(mockUserRepositoryInstance.getUserById).toHaveBeenCalledWith(
        mockRegularUser._id.toString(),
        mockSession
      );
      expect(mockUserRepositoryInstance.getUserById).toHaveBeenCalledWith(
        mockAuthenticatedAdmin.userId,
        mockSession
      );
      expect(mockUserRepositoryInstance.terminateUser).toHaveBeenCalledWith(
        mockRegularUser._id.toString(),
        mockAuthenticatedAdmin.userId,
        mockAuthenticatedAdmin.tenantId,
        mockSession
      );
      expect(mockSession.commitTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(`Terminate request for ${mockRegularUser._id.toString()}`);
    });

    it('should successfully terminate an admin user when there are multiple admins', async () => {
      // Arrange
      mockUserRepositoryInstance.getUserById
        .mockResolvedValueOnce(mockAdminUserForTermination) // Target admin user
        .mockResolvedValueOnce(mockAdminUser); // Actor verification
      mockUserRepositoryInstance.getActiveAdminCount.mockResolvedValue(2); // More than 1 admin
      mockUserRepositoryInstance.terminateUser.mockResolvedValue({ modifiedCount: 1 });

      // Act
      await userService.terminateUser(mockAdminUserForTermination._id.toString(), mockAuthenticatedAdmin);

      // Assert
      expect(mockUserRepositoryInstance.getActiveAdminCount).toHaveBeenCalledWith(
        mockAuthenticatedAdmin.tenantId,
        mockSession
      );
      expect(mockUserRepositoryInstance.terminateUser).toHaveBeenCalledWith(
        mockAdminUserForTermination._id.toString(),
        mockAuthenticatedAdmin.userId,
        mockAuthenticatedAdmin.tenantId,
        mockSession
      );
      expect(mockSession.commitTransaction).toHaveBeenCalled();
    });

    it('should throw ForbiddenError when non-admin tries to terminate user', async () => {
      // Act & Assert
      await expect(
        userService.terminateUser(mockRegularUser._id.toString(), mockAuthenticatedUser)
      ).rejects.toThrow(ForbiddenError);
      await expect(
        userService.terminateUser(mockRegularUser._id.toString(), mockAuthenticatedUser)
      ).rejects.toThrow('Only admins can terminate users');

      // Verify transaction was not started
      expect(mongoose.startSession).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenError when admin tries to terminate themselves', async () => {
      // Act & Assert
      await expect(
        userService.terminateUser(mockAuthenticatedAdmin.userId, mockAuthenticatedAdmin)
      ).rejects.toThrow(ForbiddenError);
      await expect(
        userService.terminateUser(mockAuthenticatedAdmin.userId, mockAuthenticatedAdmin)
      ).rejects.toThrow('Self termination is not allowed');

      // Verify transaction was not started
      expect(mongoose.startSession).not.toHaveBeenCalled();
    });

    it('should throw NotFoundError when user to be terminated does not exist', async () => {
      // Arrange
      mockUserRepositoryInstance.getUserById.mockResolvedValueOnce(null); // User not found

      // Act & Assert
      await expect(
        userService.terminateUser('nonexistentuser123', mockAuthenticatedAdmin)
      ).rejects.toThrow(NotFoundError);
      await expect(
        userService.terminateUser('nonexistentuser123', mockAuthenticatedAdmin)
      ).rejects.toThrow('User nonexistentuser123 not found');

      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
    });

    it('should throw ForbiddenError when trying to terminate user from different tenant', async () => {
      // Arrange
      mockUserRepositoryInstance.getUserById.mockResolvedValueOnce(mockDifferentTenantUser);

      // Act & Assert
      await expect(
        userService.terminateUser(mockDifferentTenantUser._id.toString(), mockAuthenticatedAdmin)
      ).rejects.toThrow(ForbiddenError);

      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
    });

    it('should throw ConflictError when user is already terminated', async () => {
      // Arrange
      mockUserRepositoryInstance.getUserById.mockResolvedValueOnce(mockTerminatedUser);

      // Act & Assert
      await expect(
        userService.terminateUser(mockTerminatedUser._id.toString(), mockAuthenticatedAdmin)
      ).rejects.toThrow(ConflictError);

      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
    });

    it('should throw ForbiddenError when actor loses admin privileges during transaction', async () => {
      // Arrange
      const nonAdminActor = { ...mockAdminUser, role: UserRole.USER };
      mockUserRepositoryInstance.getUserById
        .mockResolvedValueOnce(mockRegularUser) // Target user
        .mockResolvedValueOnce(nonAdminActor); // Actor verification - no longer admin

      // Act & Assert
      await expect(
        userService.terminateUser(mockRegularUser._id.toString(), mockAuthenticatedAdmin)
      ).rejects.toThrow(ForbiddenError);

      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
    });

    it('should throw ForbiddenError when trying to terminate the last active admin', async () => {
      // Arrange
      mockUserRepositoryInstance.getUserById
        .mockResolvedValueOnce(mockAdminUserForTermination) // Target admin user
        .mockResolvedValueOnce(mockAdminUser); // Actor verification
      mockUserRepositoryInstance.getActiveAdminCount.mockResolvedValue(1); // Only 1 admin left

      // Act & Assert
      await expect(
        userService.terminateUser(mockAdminUserForTermination._id.toString(), mockAuthenticatedAdmin)
      ).rejects.toThrow(ForbiddenError);

      expect(mockUserRepositoryInstance.getActiveAdminCount).toHaveBeenCalledWith(
        mockAuthenticatedAdmin.tenantId,
        mockSession
      );
      expect(mockUserRepositoryInstance.terminateUser).not.toHaveBeenCalled();
      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
    });

    it('should handle database errors during termination', async () => {
      // Arrange
      const dbError = new Error('Database connection failed');
      mockUserRepositoryInstance.getUserById.mockRejectedValueOnce(dbError);

      // Act & Assert
      await expect(
        userService.terminateUser(mockRegularUser._id.toString(), mockAuthenticatedAdmin)
      ).rejects.toThrow('Database connection failed');

      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
    });

    it('should handle repository termination errors', async () => {
      // Arrange
      const terminationError = new Error('Failed to update user termination status');
      mockUserRepositoryInstance.getUserById
        .mockResolvedValueOnce(mockRegularUser) // Target user
        .mockResolvedValueOnce(mockAdminUser); // Actor verification
      mockUserRepositoryInstance.terminateUser.mockRejectedValueOnce(terminationError);

      // Act & Assert
      await expect(
        userService.terminateUser(mockRegularUser._id.toString(), mockAuthenticatedAdmin)
      ).rejects.toThrow('Failed to update user termination status');

      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
    });

    it('should handle actor not found in database during verification', async () => {
      // Arrange
      mockUserRepositoryInstance.getUserById
        .mockResolvedValueOnce(mockRegularUser) // Target user
        .mockResolvedValueOnce(null); // Actor not found

      // Act & Assert
      await expect(
        userService.terminateUser(mockRegularUser._id.toString(), mockAuthenticatedAdmin)
      ).rejects.toThrow(ForbiddenError);

      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
    });

    it('should ensure session is always ended even on unexpected errors', async () => {
      // Arrange
      const unexpectedError = new Error('Unexpected system error');
      mockUserRepositoryInstance.getUserById.mockImplementationOnce(() => {
        throw unexpectedError;
      });

      // Act & Assert
      await expect(
        userService.terminateUser(mockRegularUser._id.toString(), mockAuthenticatedAdmin)
      ).rejects.toThrow('Unexpected system error');

      // Verify session cleanup always happens
      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
    });
  });
});
