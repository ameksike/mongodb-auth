# MongoDB Password Authentication

## Overview

Password authentication is the most common and straightforward method for connecting to MongoDB. It uses a username and password combination to authenticate users against a specific authentication database.

## Prerequisites

- MongoDB server with authentication enabled
- User account created in MongoDB
- Node.js and npm installed

## Configuration

### Environment Variables

Create a `.env` file in your project root:

```env
MONGO_HOST=localhost
MONGO_PORT=27017
MONGO_USERNAME=your_username
MONGO_PASSWORD=your_password
MONGO_AUTH_SOURCE=admin
MONGO_DATABASE=testdb
```

### MongoDB User Setup

1. **Connect to MongoDB as admin:**
   ```bash
   mongosh --host localhost --port 27017
   ```

2. **Create authentication database and user:**
   ```javascript
   use admin
   db.createUser({
     user: "your_username",
     pwd: "your_password",
     roles: [
       { role: "readWrite", db: "testdb" },
       { role: "dbAdmin", db: "testdb" }
     ]
   })
   ```

3. **Enable authentication in MongoDB configuration:**
   ```yaml
   # In mongod.conf
   security:
     authorization: enabled
   ```

## Connection URI Format

```
mongodb://username:password@host:port/database?authSource=authDatabase
```

### Parameters Explained

- **username**: MongoDB username
- **password**: User password
- **host**: MongoDB server hostname/IP
- **port**: MongoDB server port (default: 27017)
- **database**: Target database name
- **authSource**: Database where user credentials are stored (usually 'admin')

## Security Best Practices

1. **Use Strong Passwords**: Minimum 12 characters with mixed case, numbers, and symbols
2. **Principle of Least Privilege**: Grant only necessary permissions
3. **Environment Variables**: Never hardcode credentials in source code
4. **Connection Encryption**: Use TLS/SSL in production
5. **Regular Rotation**: Change passwords periodically

## Common Issues and Solutions

### Authentication Failed

**Error**: `Authentication failed`

**Solutions**:
- Verify username and password
- Check if user exists in the specified authSource
- Ensure authentication is enabled on MongoDB server

### Connection Timeout

**Error**: `Server selection timed out`

**Solutions**:
- Verify MongoDB server is running
- Check network connectivity
- Verify host and port configuration
- Check firewall settings

### Authorization Failed

**Error**: `Not authorized to execute this command`

**Solutions**:
- Verify user has appropriate roles
- Check database permissions
- Review role assignments

## MongoDB Shell Equivalent

### Basic Connection
```bash
mongosh "mongodb://username:password@localhost:27017/testdb?authSource=admin"
```

### Explicit Parameters
```bash
mongosh --host localhost --port 27017 --username your_username --password --authenticationDatabase admin
```

### Common Operations
```javascript
// List databases
show dbs

// Switch to database
use testdb

// List collections
show collections

// Query collection
db.auth_demo.find()

// Insert document
db.auth_demo.insertOne({
  message: "Hello World",
  timestamp: new Date()
})
```

## Production Considerations

1. **Connection Pooling**: Configure appropriate pool size for your application
2. **Connection Limits**: Monitor and set appropriate connection limits
3. **Monitoring**: Implement logging and monitoring for authentication events
4. **Backup Strategy**: Ensure authentication credentials are included in backup procedures
5. **High Availability**: Configure replica sets with proper authentication

## Advanced Configuration

### Connection Options

```javascript
const client = new MongoClient(uri, {
  maxPoolSize: 10,          // Maximum connections in pool
  serverSelectionTimeoutMS: 5000,  // Timeout for server selection
  socketTimeoutMS: 45000,   // Socket timeout
  family: 4,                // Use IPv4
  authMechanism: 'SCRAM-SHA-256'    // Authentication mechanism
});
```

### SCRAM Authentication Mechanisms

- **SCRAM-SHA-1**: Legacy mechanism (not recommended)
- **SCRAM-SHA-256**: Current default, more secure

## Troubleshooting Checklist

- [ ] MongoDB server is running and accessible
- [ ] Authentication is enabled in MongoDB configuration
- [ ] User exists and has correct permissions
- [ ] Connection string format is correct
- [ ] Network connectivity is working
- [ ] Firewall allows connections on MongoDB port
- [ ] Environment variables are loaded correctly

## Related Topics

- [Certificate Authentication](./certificate-authentication.md)
- [AWS IAM Authentication](./aws-authentication.md)
- [API Key Authentication](./api-key-authentication.md)
- [Service Account Authentication](./service-account-authentication.md)