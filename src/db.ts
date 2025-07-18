import mongoose from 'mongoose';
import logger from '@utils/logger';
import { config } from '@config/config';


export const connectDB = async () => {
    try  {
        const mongoUri = config.MONGODB_CONNECTION_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_CONNECTION_URI environment variable is not defined');
        }
        
        logger.info('Connecting to MongoDB...');
        await mongoose.connect(mongoUri, {dbName: 'TenantManagementHQ'});
        logger.info('Connected to MongoDB successfully');
    } catch (error) {
        logger.error('Error connecting to MongoDB', { error: error instanceof Error ? error.message : 'Unknown error' });
        throw new Error('Error connecting to MongoDB: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
}