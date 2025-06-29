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
  role: 'user',
  createdAt: new Date('2023-01-01T00:00:00.000Z')
};

export const mockAdminUser = {
  _id: '507f1f77bcf86cd799439013',
  userName: 'admin',
  email: 'admin@test.com',
  password: 'hashedpassword',
  tenantId: '507f1f77bcf86cd799439011',
  role: 'admin',
  createdAt: new Date('2023-01-01T00:00:00.000Z')
};
