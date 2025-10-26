# PhotoStore API

A RESTful API for a photography store built with Node.js, Express, and Sequelize ORM. Provides role-based authentication and CRUD operations for products, customers, orders, and staff management.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Security Features](#security-features)
- [Deployment](#deployment)
- [License](#license)

## ✨ Features

- **User Management**: Customer, Staff, and Admin roles with separate authentication
- **Product Management**: CRUD operations for photography products/services
- **Order Management**: Create and manage customer orders
- **Role-Based Access Control**: Middleware-based authorization
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Centralized Joi validation for all endpoints
- **Logging**: Winston + Morgan for comprehensive request/error logging
- **Database Support**: MySQL (production) and SQLite (development)

## 🛠 Tech Stack

- **Runtime**: Node.js v18+
- **Framework**: Express.js
- **Database**: MySQL (AWS RDS) / SQLite
- **ORM**: Sequelize
- **Authentication**: JWT + bcrypt
- **Validation**: Joi
- **Security**: Helmet, bcrypt
- **Logging**: Winston, Morgan
- **Environment**: dotenv

## 📦 Prerequisites

- Node.js v18.x or higher
- npm v10.x or higher
- MySQL 8.0+ (for production) OR SQLite (for development)
- Git

## 🚀 Installation

1. **Clone the repository**
```bash
git clone https://github.com/dedeepnc/photostore-api.git
cd photostore-api
```

2. **Install dependencies**
```bash
npm install
```

3. **Create data directory** (for SQLite only)
```bash
mkdir -p data
mkdir -p logs
```

## ⚙️ Configuration

1. **Copy environment template**
```bash
cp .env.example .env
```

2. **Edit `.env` file with your configuration**

### For Local Development (SQLite):
```env
# App
PORT=3001

# Database (SQLite)
DB_DIALECT=sqlite
DB_STORAGE=./data/photostore.sqlite

# Security
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=7d
JWT_ISSUER=photostore-api
JWT_AUDIENCE=photostore-users
```

### For Production (MySQL):
```env
# App
PORT=3001

# Database (MySQL)
DB_DIALECT=mysql
DB_HOST=your-rds-endpoint.rds.amazonaws.com
DB_PORT=3306
DB_NAME=photostore
DB_USER=admin
DB_PASS=your-password

# Security
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_EXPIRES_IN=7d
JWT_ISSUER=photostore-api
JWT_AUDIENCE=photostore-users
```

## 🏃 Running the Application

### Development Mode (with auto-restart)
```bash
npm run server
```

### Production Mode
```bash
npm run server
```

### Server will start on:
```
http://localhost:3001
```

## 📚 API Documentation

### Base URL
```
http://localhost:3001/api/v1
```

## 📁 Project Structure
```
photostore-api/
├── src/
│   ├── config/
│   │   └── config.js           # App configuration
│   ├── middleware/
│   │   ├── auth.js             # JWT authentication
│   │   ├── admin.js            # Admin authorization
│   │   └── staff.js            # Staff authorization
│   ├── models/
│   │   └── index.js            # Sequelize models
│   ├── routes/
│   │   ├── auth.js             # Auth routes
│   │   ├── customers.js        # Customer routes
│   │   ├── orders.js           # Order routes
│   │   └── products.js         # Product routes
│   ├── validation/
│   │   └── validation.js       # Joi validation schemas
│   ├── logger.js               # Winston logger
│   ├── morganMiddleware.js     # HTTP request logger
│   └── server.js               # App entry point
├── data/                        # SQLite database (dev)
├── logs/                        # Application logs
│   ├── combined.log
│   └── error.log
├── .env.example                 # Environment template
├── .gitignore
├── package.json
└── README.md
```

## 🔒 Security Features

1. **Environment Variables**: Sensitive data stored in `.env` file
2. **Password Hashing**: bcrypt with 10 salt rounds
3. **JWT Tokens**: Signed tokens with HS512 algorithm, 7-day expiration
4. **Authentication Middleware**: Validates JWT on protected routes
5. **Role-Based Authorization**: Admin, Staff, and Customer roles
6. **Input Validation**: Joi validation on all input data
7. **Helmet**: Security headers (XSS, clickjacking protection)
8. **Logging**: Request/error tracking with Winston + Morgan

## 🌐 Deployment

### AWS Deployment (EC2 + RDS)

#### 1. EC2 Setup
- Instance: t2.micro (Amazon Linux 2023)
- Region: us-east-1
- Security Group: Allow ports 22 (SSH) and 3001 (API)

#### 2. RDS Setup
- Engine: MySQL 8.0
- Instance: db.t3.micro
- Region: ap-southeast-2 (Sydney)
- Public access: Enabled (for testing)

#### 3. Deployment Steps

**SSH into EC2:**
```bash
ssh -i your-key.pem ec2-user@your-ec2-public-ip
```

**Install Node.js:**
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
```

**Clone and setup:**
```bash
git clone https://github.com/dedeepnc/photostore-api.git
cd photostore-api
npm install
```

**Configure environment:**
```bash
nano .env
# Add your RDS credentials
```

**Run with PM2:**
```bash
npm install -g pm2
pm2 start src/server.js --name photostore-api
pm2 save
pm2 startup
```

## 📝 License

This project is developed as part of BIS311 coursework at Holmesglen Institute.

## 👤 Author

**Phonnatcha Chantaro**  
Student ID: 100671650  
GitHub: [@dedeepnc](https://github.com/dedeepnc)

## 🙏 Acknowledgments

- Holmesglen Institute - BIS311 Course
- AWS Free Tier for cloud hosting
- Open source community for excellent packages
