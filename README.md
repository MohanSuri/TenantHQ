# TenantHQ

![WIP](https://img.shields.io/badge/status-work--in--progress-yellow)

A modern multi-tenant application management system built with Node.js, TypeScript, Express, and MongoDB. This application provides a robust foundation for managing multiple tenants with clean architecture and comprehensive logging.

## 🚀 Features

- **Multi-tenant Architecture**: Create and manage multiple tenants with isolated data
- **RESTful API**: Clean and well-documented API endpoints
- **TypeScript**: Full type safety and modern JavaScript features
- **MongoDB Integration**: Robust data persistence with Mongoose ODM
- **Structured Logging**: Comprehensive logging with Winston
- **Clean Architecture**: Layered architecture with separation of concerns
- **Error Handling**: Comprehensive error handling throughout the application

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Logging**: Winston
- **Authentication**: JWT (ready for implementation)
- **Password Hashing**: bcryptjs

## 📁 Project Structure

```
src/
├── app.ts                 # Application entry point
├── db.ts                  # Database connection
├── config/               # Configuration files
├── controllers/          # Request handlers
│   └── tenantController.ts
├── middleware/           # Express middleware
├── models/              # Database models
│   ├── Tenant.ts
│   └── User.ts
├── repositories/        # Data access layer
│   ├── TenantRepository.ts
│   └── UserRepository.ts
├── routes/             # API routes
│   ├── auth.routes.ts
│   └── tenant.routes.ts
├── services/           # Business logic
│   └── tenantService.ts
├── testScripts/        # API testing files
│   ├── testAPI.http
│   └── testMongoose.ts
└── utils/              # Utility functions
    └── logger.ts
```

## 🚦 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd TenantHQ
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your MongoDB connection string:
   ```
   MONGODB_CONNECTION_URI=mongodb://localhost:27017/tenanthq
   ```

4. **Build the project**
   ```bash
   npm run build
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Start the production server**
   ```bash
   npm start
   ```

## 📚 API Documentation

### Base URL
```
http://localhost:3000
```

### Endpoints

#### Health Check
- **GET** `/` - Welcome message
- **GET** `/health` - API health status

#### Tenant Management
- **POST** `/api/tenant/create` - Create a new tenant
- **GET** `/api/tenant/` - Get all tenants

### API Examples

#### Create Tenant
```http
POST /api/tenant/create
Content-Type: application/json

{
  "name": "Example Tenant",
  "domain": "example.com"
}
```

#### Get All Tenants
```http
GET /api/tenant/
```

## 🧪 Testing

# TenantHQ

![WIP](https://img.shields.io/badge/status-work--in--progress-yellow)

A modern multi-tenant application management system...### API Testing
The project includes comprehensive API tests in `src/testScripts/testAPI.http`:

- **VS Code**: Install [Rest client extention](https://marketplace.visualstudio.com/items?itemName=humao.rest-client)  and click "Send Request" above each test
- **Postman**: Import the HTTP file or copy the requests manually
- **curl**: Convert the requests to curl commands for command-line testing

**Test Coverage:**
- ✅ Health check endpoints
- ✅ Tenant creation (success cases)
- ✅ Duplicate tenant validation
- ✅ Input validation (missing fields)
- ✅ Error handling scenarios
- ✅ List all tenants functionality

**Quick Test:**
1. Start the server: `npm run dev`
2. Open `src/testScripts/testAPI.http` in VS Code
3. Install REST Client extension if needed
4. Click "Send Request" above any test

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the TypeScript project
- `npm start` - Start production server
- `npm run test` - Run tests (to be implemented)

### Code Style

- TypeScript with strict mode enabled
- Clean architecture with layered separation
- Comprehensive error handling
- Structured logging throughout

## 🏗️ Architecture

This project follows a clean architecture pattern:

- **Controllers**: Handle HTTP requests and responses
- **Services**: Contain business logic
- **Repositories**: Handle data access
- **Models**: Define data structures
- **Utils**: Utility functions and helpers

## 📝 Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `MONGODB_CONNECTION_URI` | MongoDB connection string | Yes | - |
| `NODE_ENV` | Environment (development/production) | No | development |
| `PORT` | Server port | No | 3000 |

## 🔮 Future Enhancements

- [ ] User authentication and authorization
- [ ] Role-based access control
- [ ] API rate limiting
- [ ] Input validation middleware
- [ ] Unit and integration tests
- [ ] Docker containerization
- [ ] API documentation with Swagger/OpenAPI
- [ ] Database migrations
- [ ] Tenant isolation and data segregation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 👨‍💻 Author

Mohan suri - mohansuri92@gmail.com

---

> **Note:** This project is a work in progress and not yet production-ready.