import { UserRole } from '../../src/models/user';
import { AuthenticatedUser } from '../../src/types/auth';

export const mockTenantData = {
  _id: '507f1f77bcf86cd799439011',
  name: 'Test Tenant',
  domain: 'test.com',
  createdAt: new Date('2023-01-01T00:00:00.000Z')
};

export const mockUserData = {
  _id: '507f1f77bcf86cd799439012',
  userName: 'testuser',
  email: 'test@example.com',
  password: 'hashedpassword',
  tenantId: '507f1f77bcf86cd799439011',
  role: UserRole.USER,
  createdAt: new Date('2023-01-01T00:00:00.000Z')
} as any; // Mock as any to avoid Document interface complexity

export const mockAdminUser = {
  _id: '507f1f77bcf86cd799439013',
  userName: 'admin',
  email: 'admin@test.com',
  password: 'hashedpassword',
  tenantId: '507f1f77bcf86cd799439011',
  role: UserRole.ADMIN,
  createdAt: new Date('2023-01-01T00:00:00.000Z')
} as any; // Mock as any to avoid Document interface complexity

export const mockAuthenticatedUser: AuthenticatedUser = {
  userId: '507f1f77bcf86cd799439012',
  tenantId: '507f1f77bcf86cd799439011',
  role: 'USER'
};

export const mockAuthenticatedAdmin: AuthenticatedUser = {
  userId: '507f1f77bcf86cd799439013',
  tenantId: '507f1f77bcf86cd799439011',
  role: 'ADMIN'
};
