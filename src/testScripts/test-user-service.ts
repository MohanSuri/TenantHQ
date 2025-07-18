import { UserService } from '@services/user-service';
import { UserRole } from '@models/user';
import { connectDB } from '@/db';

async function testUserService() {
    try {
        // Connect to database
        await connectDB();
        
        console.log('Testing UserService...');
        
        const userService = UserService.getInstance();
        
        // This should trigger your breakpoint!
        const result = await userService.createUser(
            'John Doe',
            'john.doe@example.com',
            'example.com',
            UserRole.USER,
            'password123'
        );
        
        console.log('User created:', result);
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit(0);
    }
}

testUserService();
