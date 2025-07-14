# Database Integration for Dating App

This document outlines the MySQL database integration for the dating app.

## Database Schema

The application uses MySQL to store all important data:

1. **users** - Stores user information
   - id (VARCHAR(36), Primary Key)
   - email (VARCHAR(255), Unique)
   - password (VARCHAR(255))
   - name (VARCHAR(255))
   - age (INT)
   - bio (TEXT)
   - is_online (BOOLEAN)
   - is_admin (BOOLEAN)
   - created_at (TIMESTAMP)
   - updated_at (TIMESTAMP)

2. **photos** - Stores user photos
   - id (INT, Auto Increment, Primary Key)
   - user_id (VARCHAR(36), Foreign Key to users.id)
   - photo_url (VARCHAR(255))
   - created_at (TIMESTAMP)

3. **matches** - Stores user swipe actions and matches
   - id (INT, Auto Increment, Primary Key)
   - user_id (VARCHAR(36), Foreign Key to users.id)
   - target_user_id (VARCHAR(36), Foreign Key to users.id)
   - action (ENUM('like', 'pass'))
   - created_at (TIMESTAMP)
   - UNIQUE KEY (user_id, target_user_id)

4. **messages** - Stores chat messages
   - id (VARCHAR(36), Primary Key)
   - chat_id (VARCHAR(255))
   - sender_id (VARCHAR(36), Foreign Key to users.id)
   - message (TEXT)
   - timestamp (TIMESTAMP)

5. **admin_settings** - Stores application settings
   - id (INT, Auto Increment, Primary Key)
   - setting_key (VARCHAR(255), Unique)
   - setting_value (JSON)
   - updated_at (TIMESTAMP)

## Setup Instructions

1. Install MySQL or MariaDB on your server
2. Create a database and user:
   ```sql
   CREATE DATABASE datingapp;
   CREATE USER 'datingapp'@'localhost' IDENTIFIED BY 'password';
   GRANT ALL PRIVILEGES ON datingapp.* TO 'datingapp'@'localhost';
   FLUSH PRIVILEGES;
   ```

3. Configure environment variables in `.env` file:
   ```
   DB_HOST=localhost
   DB_USER=datingapp
   DB_PASSWORD=password
   DB_NAME=datingapp
   DB_PORT=3306
   JWT_SECRET=your-secret-key-should-be-long-and-secure
   PORT=12001
   ```

4. The application will automatically create the necessary tables on startup

## API Configuration

The client application is configured to connect to the API at `https://rodost.com`. Make sure to update your DNS settings to point this domain to your server.

## Model Structure

The application uses the following model files to interact with the database:

- `User.js` - User management
- `Match.js` - Match and swipe functionality
- `Message.js` - Chat message handling
- `AdminSettings.js` - Application settings

## Demo Data

The application includes demo users that are automatically created on first startup if no users exist in the database.