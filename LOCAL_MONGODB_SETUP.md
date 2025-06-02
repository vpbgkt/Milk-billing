# Local MongoDB Setup (Alternative to Atlas)

If you prefer to run MongoDB locally instead of using Atlas:

## Option 1: MongoDB Community Edition
1. Download MongoDB Community Edition from: https://www.mongodb.com/try/download/community
2. Install and start MongoDB service
3. Use this connection string in your .env:
   ```
   MONGODB_URI=mongodb://localhost:27017/milkman
   ```

## Option 2: Docker MongoDB
1. Install Docker
2. Run this command:
   ```bash
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```
3. Use this connection string in your .env:
   ```
   MONGODB_URI=mongodb://localhost:27017/milkman
   ```

## Option 3: MongoDB Atlas (Recommended for development)
Follow the instructions in MONGODB_SETUP.md for cloud database setup.
