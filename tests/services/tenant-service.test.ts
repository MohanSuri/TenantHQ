import { TenantService } from '../../src/services/tenant-service';
import { TenantRepository } from '../../src/repositories/tenant-repository';
import { UserService } from '../../src/services/user-service';
import { UserRole } from '../../src/models/user';
import logger from '../../src/utils/logger';
import { container } from 'tsyringe';

// Mock the dependencies
jest.mock('../../src/repositories/tenant-repository');
jest.mock('../../src/utils/logger');

describe('TenantService', () => {
  let tenantService: TenantService;
  let mockTenantRepositoryInstance: jest.Mocked<TenantRepository>;
  let mockUserServiceInstance: jest.Mocked<UserService>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockTenantRepositoryInstance = {
      createTenant: jest.fn(),
      doesTenantExist: jest.fn(),
      getAllTenants: jest.fn(),
      getTenantByDomain: jest.fn(),
      getTenantById: jest.fn(),
    } as any;

    mockUserServiceInstance = {
      createUser: jest.fn(),
    } as any;

  // Directly instantiate TenantService with mocks
  tenantService = new TenantService(mockTenantRepositoryInstance, mockUserServiceInstance);
  });

  afterEach(() => {
  // No DI container usage, nothing to reset
  });

  describe('createTenant', () => {
    const mockTenantData = {
      name: 'Test Tenant',
      domain: 'test.com'
    };

    const mockCreatedTenant = {
      _id: '507f1f77bcf86cd799439011',
      id: '507f1f77bcf86cd799439011',
      name: 'Test Tenant',
      domain: 'test.com',
      createdAt: new Date(),
      toString: () => '507f1f77bcf86cd799439011'
    } as any;

    it('should create a new tenant successfully', async () => {
      // Arrange
      mockTenantRepositoryInstance.doesTenantExist.mockResolvedValue(false);
      mockTenantRepositoryInstance.createTenant.mockResolvedValue(mockCreatedTenant);
      mockUserServiceInstance.createUser.mockResolvedValue({
        _id: '507f1f77bcf86cd799439012',
        userName: 'admin',
        email: 'admin@test.com',
        tenantId: '507f1f77bcf86cd799439011',
        role: UserRole.ADMIN
      });

      // Act
      const result = await tenantService.createTenant(mockTenantData.name, mockTenantData.domain);

      // Assert
      expect(mockTenantRepositoryInstance.doesTenantExist).toHaveBeenCalledWith(mockTenantData.domain);
      expect(mockTenantRepositoryInstance.createTenant).toHaveBeenCalledWith(mockTenantData.name, mockTenantData.domain);
      expect(mockUserServiceInstance.createUser).toHaveBeenCalledWith(
        'admin',
        'admin@test.com',
        '507f1f77bcf86cd799439011',
        UserRole.ADMIN
      );
      expect(result).toEqual(mockCreatedTenant);
      expect(logger.info).toHaveBeenCalledWith('Creating tenant', { 
        name: mockTenantData.name, 
        domain: mockTenantData.domain 
      });
      expect(logger.info).toHaveBeenCalledWith('Tenant created successfully', { result: mockCreatedTenant });
      expect(logger.info).toHaveBeenCalledWith('Created admin user');
    });

    it('should throw error when tenant already exists', async () => {
      // Arrange
      mockTenantRepositoryInstance.doesTenantExist.mockResolvedValue(true);

      // Act & Assert
      await expect(tenantService.createTenant(mockTenantData.name, mockTenantData.domain))
        .rejects.toThrow('Tenant test.com already exists');

      expect(mockTenantRepositoryInstance.doesTenantExist).toHaveBeenCalledWith(mockTenantData.domain);
      expect(mockTenantRepositoryInstance.createTenant).not.toHaveBeenCalled();
      expect(mockUserServiceInstance.createUser).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith('Tenant already exists', { domain: mockTenantData.domain });
    });

    it('should handle repository errors during tenant creation', async () => {
      // Arrange
      const errorMessage = 'Database connection failed';
      mockTenantRepositoryInstance.doesTenantExist.mockResolvedValue(false);
      mockTenantRepositoryInstance.createTenant.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(tenantService.createTenant(mockTenantData.name, mockTenantData.domain))
        .rejects.toThrow(errorMessage);

      expect(mockTenantRepositoryInstance.doesTenantExist).toHaveBeenCalledWith(mockTenantData.domain);
      expect(mockTenantRepositoryInstance.createTenant).toHaveBeenCalledWith(mockTenantData.name, mockTenantData.domain);
      expect(mockUserServiceInstance.createUser).not.toHaveBeenCalled();
    });

    it('should handle user creation failure after tenant creation', async () => {
      // Arrange
  mockTenantRepositoryInstance.doesTenantExist.mockResolvedValue(false);
  mockTenantRepositoryInstance.createTenant.mockResolvedValue(mockCreatedTenant);
  mockUserServiceInstance.createUser.mockRejectedValue(new Error('User creation failed'));

      // Act & Assert
      await expect(tenantService.createTenant(mockTenantData.name, mockTenantData.domain))
        .rejects.toThrow('User creation failed');

      expect(mockTenantRepositoryInstance.createTenant).toHaveBeenCalled();
      expect(mockUserServiceInstance.createUser).toHaveBeenCalled();
    });
  });

  describe('getAllTenants', () => {
    it('should return all tenants successfully', async () => {
      // Arrange
      const mockTenants = [
        { _id: '1', name: 'Tenant 1', domain: 'tenant1.com' },
        { _id: '2', name: 'Tenant 2', domain: 'tenant2.com' }
      ];
      mockTenantRepositoryInstance.getAllTenants.mockResolvedValue(mockTenants);

      // Act
      const result = await tenantService.getAllTenants();

      // Assert
      expect(mockTenantRepositoryInstance.getAllTenants).toHaveBeenCalled();
      expect(result).toEqual(mockTenants);
      expect(logger.info).toHaveBeenCalledWith('Fetching all tenants');
      expect(logger.info).toHaveBeenCalledWith('Tenants fetched successfully', { count: mockTenants.length });
    });

    it('should return empty array when no tenants exist', async () => {
      // Arrange
      mockTenantRepositoryInstance.getAllTenants.mockResolvedValue([]);

      // Act
      const result = await tenantService.getAllTenants();

      // Assert
      expect(result).toEqual([]);
      expect(logger.info).toHaveBeenCalledWith('Tenants fetched successfully', { count: 0 });
    });

    it('should handle repository errors and throw original error', async () => {
      // Arrange
      const errorMessage = 'Database connection failed';
      const error = new Error(errorMessage);
      mockTenantRepositoryInstance.getAllTenants.mockRejectedValue(error);

      // Act & Assert
      await expect(tenantService.getAllTenants())
        .rejects.toThrow(errorMessage);

      expect(mockTenantRepositoryInstance.getAllTenants).toHaveBeenCalled();
    });

    it('should handle unknown errors', async () => {
      // Arrange
      const unknownError = 'Unknown error occurred';
      mockTenantRepositoryInstance.getAllTenants.mockRejectedValue(unknownError);

      // Act & Assert
      await expect(tenantService.getAllTenants())
        .rejects.toEqual(unknownError);

      expect(mockTenantRepositoryInstance.getAllTenants).toHaveBeenCalled();
    });
  });
});