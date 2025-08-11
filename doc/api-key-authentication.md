# MongoDB API Key Authentication

## Overview

API Key authentication provides a programmatic way to authenticate with MongoDB Atlas using public/private key pairs. This method is ideal for applications, scripts, and automation tools that need secure, non-interactive access to MongoDB Atlas clusters.

## Prerequisites

- MongoDB Atlas account with appropriate permissions
- Atlas project with API access enabled
- Node.js and npm installed

## MongoDB Atlas API Key Setup

### 1. Create Organization API Key

1. **Log in to MongoDB Atlas**
2. **Navigate to Organization Settings**
3. **Go to "Access Manager" → "API Keys"**
4. **Click "Create API Key"**
5. **Configure permissions and description**

### 2. Create Project API Key

1. **Navigate to Project Settings**
2. **Go to "Access Manager" → "API Keys"**
3. **Click "Create API Key"**
4. **Set appropriate project permissions**

### 3. API Key Permissions

```javascript
// Organization-level permissions
{
  "orgId": "60a2b8f8f0c2b80001234567",
  "roles": [
    "ORG_MEMBER",
    "ORG_PROJECT_CREATOR"
  ]
}

// Project-level permissions
{
  "projectId": "60a2b8f8f0c2b80001234568", 
  "roles": [
    "PROJECT_OWNER",
    "PROJECT_DATA_ACCESS_ADMIN",
    "PROJECT_DATA_ACCESS_READ_WRITE"
  ]
}
```

## Database User Configuration

### 1. Create Database User for API Key

```javascript
// Atlas Database Access configuration
{
  "username": "api-key-user",
  "authenticationMethod": "SCRAM",
  "password": "generated-password",
  "databaseRoles": [
    {
      "databaseName": "testdb",
      "roleName": "readWrite"
    },
    {
      "databaseName": "admin", 
      "roleName": "clusterMonitor"
    }
  ],
  "scopes": [
    {
      "name": "my-cluster",
      "type": "CLUSTER"
    }
  ]
}
```

### 2. Alternative: X.509 Certificate User

```javascript
// For X.509 certificate-based API authentication
{
  "username": "$external",
  "authenticationMethod": "X509",
  "x509Type": "MANAGED",
  "databaseRoles": [
    {
      "databaseName": "testdb",
      "roleName": "readWrite"
    }
  ]
}
```

## Environment Variables

Create a `.env` file:

```env
API_KEY_MONGO_CLUSTER_URL=your-cluster.mongodb.net
API_KEY_MONGO_DATABASE=testdb
MONGODB_API_PUBLIC_KEY=your_public_api_key
MONGODB_API_PRIVATE_KEY=your_private_api_key
```

## Connection Methods

### Method 1: MONGODB-X509 Authentication

```javascript
const uri = `mongodb+srv://${publicKey}:${privateKey}@cluster.mongodb.net/database?authSource=$external&authMechanism=MONGODB-X509`;

const client = new MongoClient(uri, {
  authMechanism: 'MONGODB-X509',
  authSource: '$external'
});
```

### Method 2: PLAIN Authentication

```javascript
const uri = `mongodb+srv://cluster.mongodb.net/database`;

const client = new MongoClient(uri, {
  authMechanism: 'PLAIN',
  authSource: '$external',
  auth: {
    username: publicKey,
    password: privateKey
  }
});
```

### Method 3: Programmatic Authentication

```javascript
const { MongoClient } = require('mongodb');

async function connectWithAPIKey() {
  const client = new MongoClient('mongodb+srv://cluster.mongodb.net/', {
    auth: {
      username: process.env.MONGODB_API_PUBLIC_KEY,
      password: process.env.MONGODB_API_PRIVATE_KEY
    },
    authSource: '$external',
    authMechanism: 'PLAIN'
  });
  
  await client.connect();
  return client;
}
```

## Atlas Admin API Integration

### Using API Keys for Atlas Management

```javascript
const axios = require('axios');

class AtlasAPI {
  constructor(publicKey, privateKey) {
    this.auth = {
      username: publicKey,
      password: privateKey
    };
    this.baseURL = 'https://cloud.mongodb.com/api/atlas/v1.0';
  }
  
  async getClusters(groupId) {
    const response = await axios.get(
      `${this.baseURL}/groups/${groupId}/clusters`,
      { auth: this.auth }
    );
    return response.data;
  }
  
  async getDatabases(groupId, clusterName) {
    const response = await axios.get(
      `${this.baseURL}/groups/${groupId}/clusters/${clusterName}/databases`,
      { auth: this.auth }
    );
    return response.data;
  }
}

// Usage
const atlas = new AtlasAPI(
  process.env.MONGODB_API_PUBLIC_KEY,
  process.env.MONGODB_API_PRIVATE_KEY
);

const clusters = await atlas.getClusters('your-project-id');
```

## Security Best Practices

1. **Secure Storage**: Store API keys in secure credential management systems
2. **Least Privilege**: Grant minimum necessary permissions
3. **Key Rotation**: Regularly rotate API keys
4. **Network Security**: Use IP allowlists and VPC peering
5. **Monitoring**: Enable audit logs and monitoring
6. **Environment Isolation**: Use different keys for different environments

## MongoDB Shell Equivalent

### Using API Keys with mongosh

```bash
# Method 1: Connection string with API key
mongosh "mongodb+srv://PUBLIC_KEY:PRIVATE_KEY@cluster.mongodb.net/database?authSource=\$external&authMechanism=MONGODB-X509"

# Method 2: Separate authentication
mongosh "mongodb+srv://cluster.mongodb.net/database" \
  --username "PUBLIC_KEY" \
  --password "PRIVATE_KEY" \
  --authenticationDatabase '$external' \
  --authenticationMechanism PLAIN
```

### Common Operations

```javascript
// After connection
show dbs
use testdb
show collections

// Query with API key user
db.auth_demo.find()

// Insert document
db.auth_demo.insertOne({
  message: "Hello from API key",
  timestamp: new Date()
})
```

## API Key Management

### 1. Creating API Keys via Atlas UI

1. Navigate to Project Settings
2. Access Manager → API Keys
3. Create API Key with description
4. Select appropriate permissions
5. Copy and securely store the keys

### 2. Creating API Keys via API

```javascript
const axios = require('axios');

async function createAPIKey(orgId, description, roles) {
  const response = await axios.post(
    `https://cloud.mongodb.com/api/atlas/v1.0/orgs/${orgId}/apiKeys`,
    {
      desc: description,
      roles: roles
    },
    {
      auth: {
        username: 'existing_public_key',
        password: 'existing_private_key'
      }
    }
  );
  
  return response.data;
}

// Create new API key
const newKey = await createAPIKey('org-id', 'Automated Script Key', ['ORG_MEMBER']);
```

### 3. API Key Permissions

```javascript
// Organization roles
const orgRoles = [
  'ORG_OWNER',           // Full organization access
  'ORG_MEMBER',          // Basic organization access
  'ORG_PROJECT_CREATOR', // Can create projects
  'ORG_BILLING_ADMIN',   // Billing management
  'ORG_READ_ONLY'        // Read-only access
];

// Project roles
const projectRoles = [
  'PROJECT_OWNER',                    // Full project access
  'PROJECT_DATA_ACCESS_ADMIN',        // Database user management
  'PROJECT_DATA_ACCESS_READ_WRITE',   // Read/write database access
  'PROJECT_DATA_ACCESS_READ_ONLY',    // Read-only database access
  'PROJECT_CLUSTER_MANAGER',          // Cluster management
  'PROJECT_READ_ONLY'                 // Read-only project access
];
```

## Common Issues and Solutions

### Invalid API Key

**Error**: `Invalid API key`

**Solutions**:
- Verify public and private keys are correct
- Check if API key is active (not revoked)
- Ensure API key has appropriate permissions
- Validate project/organization access

### Authentication Failed

**Error**: `Authentication failed`

**Solutions**:
- Check authentication mechanism (X509 vs PLAIN)
- Verify authSource is set to '$external'
- Ensure database user exists for API key
- Check IP allowlist includes your address

### Insufficient Permissions

**Error**: `Not authorized to execute this command`

**Solutions**:
- Verify API key has necessary project roles
- Check database user roles and permissions
- Ensure cluster-level access is granted
- Review scope restrictions

## Automation Examples

### 1. Automated Backup Script

```javascript
async function createBackup() {
  // Connect using API key
  const client = new MongoClient(uri, {
    auth: {
      username: process.env.MONGODB_API_PUBLIC_KEY,
      password: process.env.MONGODB_API_PRIVATE_KEY
    },
    authSource: '$external'
  });
  
  await client.connect();
  
  // Perform backup operations
  const db = client.db('production');
  const collections = await db.listCollections().toArray();
  
  for (const collection of collections) {
    const data = await db.collection(collection.name).find().toArray();
    // Save backup data
  }
  
  await client.close();
}
```

### 2. Monitoring Script

```javascript
async function monitorClusters() {
  const atlas = new AtlasAPI(
    process.env.MONGODB_API_PUBLIC_KEY,
    process.env.MONGODB_API_PRIVATE_KEY
  );
  
  const clusters = await atlas.getClusters(process.env.PROJECT_ID);
  
  for (const cluster of clusters.results) {
    console.log(`Cluster: ${cluster.name}`);
    console.log(`Status: ${cluster.stateName}`);
    console.log(`MongoDB Version: ${cluster.mongoDBVersion}`);
    
    // Check cluster health
    const measurements = await atlas.getClusterMeasurements(
      process.env.PROJECT_ID,
      cluster.name
    );
    
    // Alert if issues detected
    if (measurements.some(m => m.value > threshold)) {
      await sendAlert(`Cluster ${cluster.name} needs attention`);
    }
  }
}
```

## Development vs Production

### Development Configuration

```javascript
// Development settings
{
  auth: {
    username: process.env.DEV_MONGODB_API_PUBLIC_KEY,
    password: process.env.DEV_MONGODB_API_PRIVATE_KEY
  },
  authSource: '$external',
  serverSelectionTimeoutMS: 30000,  // Longer timeout
  retryWrites: false                 // Disable for testing
}
```

### Production Configuration

```javascript
// Production settings
{
  auth: {
    username: process.env.PROD_MONGODB_API_PUBLIC_KEY,
    password: process.env.PROD_MONGODB_API_PRIVATE_KEY
  },
  authSource: '$external',
  maxPoolSize: 50,
  serverSelectionTimeoutMS: 5000,
  retryWrites: true,
  retryReads: true,
  readPreference: 'secondaryPreferred'
}
```

## Troubleshooting Checklist

- [ ] API keys are correctly generated in Atlas
- [ ] Public and private keys are properly stored
- [ ] API key has appropriate organization/project permissions
- [ ] Database user exists with correct roles
- [ ] IP address is in Atlas allowlist
- [ ] Authentication mechanism matches configuration
- [ ] authSource is set to '$external'
- [ ] Network connectivity allows Atlas access

## Related Topics

- [Password Authentication](./password-authentication.md)
- [Certificate Authentication](./certificate-authentication.md)
- [AWS IAM Authentication](./aws-authentication.md)
- [Service Account Authentication](./service-account-authentication.md)