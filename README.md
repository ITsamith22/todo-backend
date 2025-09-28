# MERN Todo Application Backend

A robust backend for a Todo application built with the MERN stack.

## Features

- User Authentication (JWT)
- Profile Management with Image Upload
- Todo CRUD Operations
- Input Validation
- Error Handling

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   - Create a `.env` file in the root directory
   - Add necessary environment variables (see .env.example)

3. Start the server:
   ```bash
   npm run dev    # Development mode
   npm start      # Production mode
   ```

## API Endpoints

### Auth Routes
- POST /api/auth/register - Register new user
- POST /api/auth/login - User login
- GET /api/auth/profile - Get user profile

### Todo Routes
- GET /api/todos - Get all todos
- POST /api/todos - Create new todo
- PUT /api/todos/:id - Update todo
- DELETE /api/todos/:id - Delete todo

## Directory Structure

```
backend/
├── src/
│   ├── config/         # Configuration files
│   ├── controllers/    # Route controllers
│   ├── middleware/     # Custom middleware
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── utils/          # Utility functions
│   └── uploads/        # File uploads
├── .env                # Environment variables
├── .gitignore         # Git ignore file
└── server.js          # Entry point
```