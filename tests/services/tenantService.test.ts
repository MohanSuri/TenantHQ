import { TenantService } from '../../src/services/tenantService';
import { TenantRepository } from '../../src/repositories/TenantRepository';
import { UserService } from '../../src/services/UserService';
import { UserRole } from '../../src/models/User';
import logger from '../../src/utils/logger';

// Mock the dependencies
jest.mock('../../src/repositories/TenantRepository');
jest.mock('../../src/services/UserService');
jest.mock('../../src/utils/logger');

describe('TenantService', () => {
  let tenantService: TenantService;
  let mockTenantRepositoryInstance: jest.Mocked<TenantRepository>;
  let mockUserServiceInstance: jest.Mocked<UserService>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create mock instances
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

    // Mock the TenantRepository constructor
    (TenantRepository as jest.MockedClass<typeof TenantRepository>).mockImplementation(() => mockTenantRepositoryInstance);
    
    // Mock UserService.getInstance
    jest.spyOn(UserService, 'getInstance').mockReturnValue(mockUserServiceInstance);

    // Reset the singleton instance to get a fresh instance with mocked dependencies
    (TenantService as any)._instance = undefined;
    tenantService = TenantService.getInstance();
  });

  afterEach(() => {
    // Clean up singleton instance
    (TenantService as any)._instance = undefined;
  });

  describe('createTenant', () => {
    const mockTenantData = {
      name: 'Test Tenant',
      domain: 'test.com'
    };

    const mockCreatedTenant = {
      _id: '507f1f77bcf86cd799439011',
      name: 'Test Tenant',
      domain: 'test.com',
      createdAt: new Date()
    };

    it('should create a new tenant successfully', async () => {
      // Arrange
      mockTenantRepositoryInstance.doesTenantExist.mockResolvedValue(false);
      mockTenantRepositoryInstance.createTenant.mockResolvedValue(mockCreatedTenant);
      mockUserServiceInstance.createUser.mockResolvedValue({
        _id: '507f1f77bcf86cd799439012',
        userName: 'admin',
        email: 'admin@test.com'
      });

      // Act
      const result = await tenantService.createTenant(mockTenantData.name, mockTenantData.domain);

      // Assert
      expect(mockTenantRepositoryInstance.doesTenantExist).toHaveBeenCalledWith(mockTenantData.domain);
      expect(mockTenantRepositoryInstance.createTenant).toHaveBeenCalledWith(mockTenantData.name, mockTenantData.domain);
      expect(mockUserServiceInstance.createUser).toHaveBeenCalledWith(
        'admin',
        'admin@test.com',
        'test.com',
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
        .rejects.toThrow('Tenant already exists');

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

    it('should handle repository errors and throw descriptive error', async () => {
      // Arrange
      const errorMessage = 'Database connection failed';
      const error = new Error(errorMessage);
      mockTenantRepositoryInstance.getAllTenants.mockRejectedValue(error);

      // Act & Assert
      await expect(tenantService.getAllTenants())
        .rejects.toThrow(`Error fetching tenants: ${errorMessage}`);

      expect(logger.error).toHaveBeenCalledWith('Error fetching tenants', { error: errorMessage });
    });

    it('should handle unknown errors', async () => {
      // Arrange
      const unknownError = 'Unknown error occurred';
      mockTenantRepositoryInstance.getAllTenants.mockRejectedValue(unknownError);

      // Act & Assert
      await expect(tenantService.getAllTenants())
        .rejects.toThrow('Error fetching tenants: Unknown error');

      expect(logger.error).toHaveBeenCalledWith('Error fetching tenants', { error: 'Unknown error' });
    });
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance when called multiple times', () => {
      // Act
      const instance1 = TenantService.getInstance();
      const instance2 = TenantService.getInstance();

      // Assert
      expect(instance1).toBe(instance2);
      expect(instance1).toBeInstanceOf(TenantService);
    });
  });
});
