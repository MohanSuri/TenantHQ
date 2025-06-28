import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import {connectDB} from './db';
import logger from './utils/logger';

// Load environment variables
dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

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

// Import routes
import tenantRoutes from './routes/tenant.routes';
app.use('/api/tenant', tenantRoutes);

// Start server
const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, '0.0.0.0', () => {
            logger.info(`Server is running on port ${PORT}`);
            console.log(`🚀 Server is running on port ${PORT}`);
            console.log(`📚 API Documentation: http://localhost:${PORT}/`);
        });
    } catch (error) {
        logger.error('Failed to start server', { error: error instanceof Error ? error.message : 'Unknown error' });
        process.exit(1);
    }
};

startServer();