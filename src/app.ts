import express from 'express';
import cors from 'cors';
import {config} from '@config/config';
import {connectDB} from '@/db';
import logger from '@utils/logger';
import tenantRoutes from '@routes/tenant.routes';
import authRoutes from '@routes/auth.routes';
import { errorHandler } from '@middleware/error-handler-middleware';
import userRoutes from './routes/user.routes';

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Health endpoints
app.get('/', (req, res) => {
    res.status(200).json({ 
        message: 'Welcome to TenantHQ API',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
    }); 
});

app.get('/health', (req, res) => {
    res.status(200).json({ 
        message: 'API is running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

app.use('/api/tenant', tenantRoutes);
app.use('/api/', authRoutes);
app.use('/api/user', userRoutes);

// error handler middleware
app.use(errorHandler);

// Start server
const startServer = async () => {
    const port = config.PORT
    try {
        await connectDB();
        app.listen(config.PORT, '0.0.0.0', () => {
            logger.info(`Server is running on port ${port}`);
            console.log(`🚀 Server is running on port ${port}`);
            console.log(`📚 API Documentation: http://localhost:${port}/`);
        });
    } catch (error) {
        logger.error('Failed to start server', { error: error instanceof Error ? error.message : 'Unknown error' });
        process.exit(1);
    }
};

startServer();