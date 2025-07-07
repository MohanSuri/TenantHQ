import mongoose from 'mongoose';
import dotenv from 'dotenv';
import {TenantRepository} from '@repositories/tenant-repository';
import { UserRepository } from '@repositories/user-repository';
dotenv.config();

async function connectToDatabase() {
    try {
        console.log('Connecting to MongoDB');
        await mongoose.connect(process.env.MONGODB_CONNECTION_URI!);
        console.log('Connected to MongoDB');
        const tenantRepository = new TenantRepository();
        
        // Create a tenant first to get a valid tenant ID
        // const testTenant = await tenantRepository.createTenant('Test Tenant3', 'test3.domain.com');
        // q:console.log('Created tenant:', testTenant);
        
        // Get all tenants
        const allTenants = await tenantRepository.getAllTenants();
        console.log('All tenants:', allTenants);
        
        const userRepository = new UserRepository();
        
        // Use the actual tenant ID from the created tenant
        // const tenantId = testTenant._id.toString();
        
        // await userRepository.createUser("John1", "johndoe1@example.com", "securePassword123", 'test2.domain.com');
        // await userRepository.createUser("Jake1", "jakedoe1@example.com", "securePassword456", 'test.domain.com');
        
        const usersInTenant = await userRepository.getUsersByTenant('test.domain.com');
        const usersInTenant2 = await userRepository.getUsersByTenant('test2.domain.com');
        console.log('Users in tenant:', usersInTenant, usersInTenant2);
        await mongoose.disconnect();
        console.log('Disconnected to MongoDB');

    }
    catch (error) {
        console.error('Error connecting to MongoDB:', error);
    }
}

connectToDatabase();