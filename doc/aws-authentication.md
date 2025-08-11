# MongoDB AWS IAM Authentication

## Overview

AWS IAM authentication allows you to connect to MongoDB Atlas using your AWS credentials instead of traditional username/password combinations. This method is particularly useful for applications running on AWS infrastructure and provides seamless integration with AWS security models.

## Prerequisites

- MongoDB Atlas cluster (AWS IAM auth is Atlas-specific)
- AWS account with appropriate IAM permissions
- AWS credentials configured (Access Key ID and Secret Access Key)
- Node.js and npm installed

## MongoDB Atlas Configuration

### 1. Enable AWS IAM Authentication

1. **Log in to MongoDB Atlas**
2. **Navigate to Database Access**
3. **Add Database User**
4. **Select "AWS IAM" as Authentication Method**
5. **Configure IAM Role or User ARN**

### 2. Configure Database User

```javascript
// Atlas Database User Configuration
{
  "authenticationMethod": "AWS IAM",
  "awsIAMType": "USER", // or "ROLE" for EC2 instances
  "awsIAMUser": "arn:aws:iam::123456789012:user/MyMongoDBUser",
  "databaseRoles": [
    {
      "databaseName": "testdb",
      "roleName": "readWrite"
    }
  ]
}
```

## AWS IAM Policy Configuration

### 1. Create IAM Policy for MongoDB Access

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "rds-connect:connect"
      ],
      "Resource": [
        "arn:aws:rds-db:region:account-id:dbuser:cluster-id/mongodb-user"
      ]
    }
  ]
}
```

### 2. Attach Policy to IAM User/Role

```bash
# Create IAM user
aws iam create-user --user-name mongodb-user

# Attach policy to user
aws iam attach-user-policy --user-name mongodb-user --policy-arn arn:aws:iam::account:policy/MongoDBAtlasAccess

# Create access keys
aws iam create-access-key --user-name mongodb-user
```

## Environment Variables

Create a `.env` file:

```env
AWS_MONGO_CLUSTER_URL=your-cluster.mongodb.net
AWS_MONGO_DATABASE=testdb
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_SESSION_TOKEN=your_session_token  # Optional for temporary credentials
AWS_REGION=us-east-1
```

## Connection Configuration

### Connection String Format

```
mongodb+srv://cluster-url/database?authSource=$external&authMechanism=MONGODB-AWS
```

### Node.js Driver Configuration

```javascript
const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://your-cluster.mongodb.net/testdb?authSource=$external&authMechanism=MONGODB-AWS';

const client = new MongoClient(uri, {
  authMechanism: 'MONGODB-AWS',
  authSource: '$external',
  serverSelectionTimeoutMS: 10000  // Increased timeout for AWS auth
});
```

## AWS Credential Methods

### 1. Environment Variables

```bash
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export AWS_SESSION_TOKEN=your_session_token  # For temporary credentials
```

### 2. AWS Credentials File

```ini
# ~/.aws/credentials
[default]
aws_access_key_id = your_access_key
aws_secret_access_key = your_secret_key

[mongodb-user]
aws_access_key_id = mongodb_access_key
aws_secret_access_key = mongodb_secret_key
```

### 3. IAM Roles (for EC2 instances)

```javascript
// Automatic credential discovery for EC2 instances
const client = new MongoClient(uri, {
  authMechanism: 'MONGODB-AWS',
  authSource: '$external'
  // No explicit credentials needed - uses instance metadata
});
```

### 4. AWS SDK Configuration

```javascript
const AWS = require('aws-sdk');

// Configure AWS SDK
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  sessionToken: process.env.AWS_SESSION_TOKEN,
  region: 'us-east-1'
});
```

## Temporary Credentials

### Using AWS STS

```javascript
const AWS = require('aws-sdk');
const sts = new AWS.STS();

// Assume role for temporary credentials
const params = {
  RoleArn: 'arn:aws:iam::123456789012:role/MongoDBRole',
  RoleSessionName: 'mongodb-session'
};

const assumeRole = await sts.assumeRole(params).promise();

// Use temporary credentials
const client = new MongoClient(uri, {
  authMechanism: 'MONGODB-AWS',
  authSource: '$external',
  auth: {
    username: assumeRole.Credentials.AccessKeyId,
    password: assumeRole.Credentials.SecretAccessKey,
    sessionToken: assumeRole.Credentials.SessionToken
  }
});
```

## Security Best Practices

1. **Principle of Least Privilege**: Grant minimal necessary permissions
2. **Credential Rotation**: Regularly rotate access keys
3. **Use IAM Roles**: Prefer IAM roles over access keys when possible
4. **Temporary Credentials**: Use STS for temporary access
5. **Network Security**: Configure Atlas network access lists
6. **Monitoring**: Enable CloudTrail and Atlas auditing

## MongoDB Shell Equivalent

### Basic Connection

```bash
# Set AWS credentials
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key

# Connect using mongosh
mongosh "mongodb+srv://your-cluster.mongodb.net/testdb?authSource=\$external&authMechanism=MONGODB-AWS"
```

### With Explicit Credentials

```bash
mongosh "mongodb+srv://your-cluster.mongodb.net/testdb" \
  --authenticationMechanism MONGODB-AWS \
  --authenticationDatabase '$external'
```

### Using AWS CLI Profile

```bash
# Set AWS profile
export AWS_PROFILE=mongodb-user

# Connect
mongosh "mongodb+srv://your-cluster.mongodb.net/testdb?authSource=\$external&authMechanism=MONGODB-AWS"
```

## Common Use Cases

### 1. EC2 Application Authentication

```javascript
// Application running on EC2 with IAM role
const client = new MongoClient(
  'mongodb+srv://cluster.mongodb.net/app?authSource=$external&authMechanism=MONGODB-AWS',
  {
    authMechanism: 'MONGODB-AWS',
    authSource: '$external'
    // Automatically uses EC2 instance IAM role
  }
);
```

### 2. Lambda Function Authentication

```javascript
// AWS Lambda function with execution role
exports.handler = async (event) => {
  const client = new MongoClient(process.env.MONGODB_URI, {
    authMechanism: 'MONGODB-AWS',
    authSource: '$external'
  });
  
  await client.connect();
  // Database operations...
  await client.close();
};
```

### 3. Cross-Account Access

```javascript
// Assume role in different AWS account
const sts = new AWS.STS();
const role = await sts.assumeRole({
  RoleArn: 'arn:aws:iam::OTHER-ACCOUNT:role/MongoDBCrossAccountRole',
  RoleSessionName: 'cross-account-mongodb'
}).promise();

// Use assumed role credentials
const client = new MongoClient(uri, {
  authMechanism: 'MONGODB-AWS',
  authSource: '$external',
  auth: {
    username: role.Credentials.AccessKeyId,
    password: role.Credentials.SecretAccessKey,
    sessionToken: role.Credentials.SessionToken
  }
});
```

## Common Issues and Solutions

### Authentication Failed

**Error**: `Authentication failed`

**Solutions**:
- Verify AWS credentials are valid and not expired
- Check IAM user/role exists in Atlas Database Access
- Ensure correct AWS region is configured
- Validate IAM policies grant necessary permissions

### Network Timeout

**Error**: `Server selection timed out`

**Solutions**:
- Check Atlas network access list includes your IP
- Verify internet connectivity and DNS resolution
- Increase serverSelectionTimeoutMS
- Check firewall settings

### Invalid Credentials

**Error**: `Invalid AWS credentials`

**Solutions**:
- Verify AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
- Check if credentials are expired
- Validate session token for temporary credentials
- Ensure credentials have correct permissions

## Monitoring and Logging

### CloudTrail Integration

```json
{
  "eventTime": "2023-01-01T12:00:00Z",
  "eventName": "AssumeRole",
  "eventSource": "sts.amazonaws.com",
  "sourceIPAddress": "10.0.0.1",
  "userIdentity": {
    "type": "IAMUser",
    "principalId": "AIDACKCEVSQ6C2EXAMPLE",
    "arn": "arn:aws:iam::123456789012:user/mongodb-user"
  },
  "resources": [
    {
      "accountId": "123456789012",
      "type": "AWS::IAM::Role",
      "ARN": "arn:aws:iam::123456789012:role/MongoDBRole"
    }
  ]
}
```

### Atlas Audit Logs

```javascript
// Enable auditing in Atlas
{
  "timestamp": "2023-01-01T12:00:00.000Z",
  "atype": "authenticate",
  "local": { "ip": "10.0.0.1", "port": 27017 },
  "remote": { "ip": "203.0.113.1", "port": 54321 },
  "users": [{ "user": "arn:aws:iam::123456789012:user/mongodb-user", "db": "$external" }],
  "result": 0
}
```

## Development vs Production

### Development Configuration

```javascript
// More permissive for development
{
  authMechanism: 'MONGODB-AWS',
  authSource: '$external',
  serverSelectionTimeoutMS: 30000,  // Longer timeout
  connectTimeoutMS: 30000,
  socketTimeoutMS: 45000
}
```

### Production Configuration

```javascript
// Optimized for production
{
  authMechanism: 'MONGODB-AWS',
  authSource: '$external',
  maxPoolSize: 50,
  serverSelectionTimeoutMS: 10000,
  heartbeatFrequencyMS: 10000,
  retryWrites: true,
  retryReads: true
}
```

## Troubleshooting Checklist

- [ ] MongoDB Atlas cluster is running and accessible
- [ ] AWS credentials are correctly configured
- [ ] IAM user/role is added to Atlas Database Access
- [ ] Network access list includes your IP address
- [ ] Connection string uses correct authentication parameters
- [ ] AWS region matches cluster region
- [ ] IAM policies grant necessary permissions
- [ ] Credentials are not expired

## Usage

You can test the AWS authentication using the following methods:

### Using npm scripts:
```bash
# Run AWS authentication demo
npm run demo:aws

# Run all authentication methods
npm run demo:all
```

### Using Node.js directly:
```bash
# Run AWS authentication demo
node src/index.js aws

# Run all authentication methods
node src/index.js all
```

### Implementation File
The AWS authentication implementation can be found in: `src/auth-aws.js`

The main demonstration function is exported as `main` and can be imported as:
```javascript
const { main: demonstrateAWSAuth } = require('./src/auth-aws');
```

## Related Topics

- [Password Authentication](./password-authentication.md)
- [Certificate Authentication](./certificate-authentication.md)
- [API Key Authentication](./api-key-authentication.md)
- [Service Account Authentication](./service-account-authentication.md)