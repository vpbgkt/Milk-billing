# MongoDB Atlas Setup Instructions

## 1. Create MongoDB Atlas Account
- Go to: https://www.mongodb.com/atlas/database
- Sign up for a free account

## 2. Create a Cluster
- Choose "Build a Database" 
- Select "FREE" tier (M0 Sandbox)
- Choose your preferred cloud provider and region
- Name your cluster (e.g., "milkman-cluster")

## 3. Create Database User
- Go to "Database Access" in the left sidebar
- Click "Add New Database User"
- Choose "Password" authentication
- Create username and password (save these!)
- Give "Read and write to any database" permissions

## 4. Configure Network Access
- Go to "Network Access" in the left sidebar  
- Click "Add IP Address"
- For development, you can click "Allow Access from Anywhere" (0.0.0.0/0)
- For production, add your specific IP addresses

## 5. Get Connection String
- Go to "Database" in the left sidebar
- Click "Connect" on your cluster
- Choose "Connect your application"
- Copy the connection string

## 6. Update .env file
Replace the MONGODB_URI in your .env file with your connection string:

MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-name>.<random-id>.mongodb.net/milkman?retryWrites=true&w=majority

Replace:
- <username> with your database username
- <password> with your database password  
- <cluster-name> with your cluster name
- <random-id> with the actual ID from your connection string

## Example:
MONGODB_URI=mongodb+srv://milkman_user:mySecurePassword123@milkman-cluster.abc123.mongodb.net/milkman?retryWrites=true&w=majority
