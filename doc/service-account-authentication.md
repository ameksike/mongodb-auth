# MongoDB Service Account Authentication

## Overview

Service Account authentication enables applications to connect to MongoDB Atlas using OIDC (OpenID Connect) with service account credentials. This method is particularly useful for automated services, serverless functions, and applications running in cloud environments like Google Cloud Platform.

## Prerequisites

- MongoDB Atlas cluster with OIDC authentication enabled
- Service account with appropriate permissions
- Identity provider configuration (Google Cloud, Azure AD, etc.)
- Node.js and npm installed

## Service Account Setup

### 1. Google Cloud Service Account

```bash
# Create service account
gcloud iam service-accounts create mongodb-service-account \
  --description="MongoDB Atlas access" \
  --display-name="MongoDB Service Account"

# Generate key file
gcloud iam service-accounts keys create service-account-key.json \
  --iam-account=mongodb-service-account@PROJECT_ID.iam.gserviceaccount.com

# Grant necessary permissions
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:mongodb-service-account@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountTokenCreator"
```

### 2. Azure Service Principal

```bash
# Create service principal
az ad sp create-for-rbac --name "mongodb-service-principal" \
  --role contributor \
  --scopes /subscriptions/SUBSCRIPTION_ID

# Output will include:
# - appId (client_id)
# - password (client_secret) 
# - tenant (tenant_id)
```

### 3. AWS Service Account (IAM Role)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::ACCOUNT:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        }
      }
    }
  ]
}
```

## MongoDB Atlas OIDC Configuration

### 1. Enable OIDC Authentication

1. **Navigate to Atlas Security > Authentication**
2. **Enable "OIDC Authentication"**
3. **Configure Identity Provider**

### 2. OIDC Provider Configuration

```javascript
// Google Cloud configuration
{
  "issuer": "https://accounts.google.com",
  "audience": "mongodb://atlas",
  "clientId": "your-client-id.apps.googleusercontent.com",
  "jwksUri": "https://www.googleapis.com/oauth2/v3/certs"
}

// Azure AD configuration  
{
  "issuer": "https://login.microsoftonline.com/TENANT_ID/v2.0",
  "audience": "api://mongodb-atlas",
  "clientId": "your-azure-client-id",
  "jwksUri": "https://login.microsoftonline.com/TENANT_ID/discovery/v2.0/keys"
}
```

### 3. Database User Configuration

```javascript
// Create OIDC database user
use $external
db.createUser({
  user: "service-account@project.iam.gserviceaccount.com",
  roles: [
    { role: "readWrite", db: "testdb" },
    { role: "dbAdmin", db: "testdb" }
  ],
  authenticationRestrictions: [
    {
      authenticationDatabase: "$external",
      authenticationMechanism: "MONGODB-OIDC"
    }
  ]
})
```

## Environment Variables

Create a `.env` file:

```env
SERVICE_ACCOUNT_MONGO_CLUSTER_URL=your-cluster.mongodb.net
SERVICE_ACCOUNT_MONGO_DATABASE=testdb
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json
SERVICE_ACCOUNT_CLIENT_EMAIL=service-account@project.iam.gserviceaccount.com
SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
SERVICE_ACCOUNT_PROJECT_ID=your-project-id
OIDC_AUDIENCE=mongodb://atlas
OIDC_ISSUER=https://accounts.google.com
```

## Connection Implementation

### JWT Token Generation

```javascript
const jwt = require('jsonwebtoken');
const fs = require('fs');

async function generateJWTToken(serviceAccountKeyPath) {
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountKeyPath, 'utf8'));
  
  const now = Math.floor(Date.now() / 1000);
  
  const payload = {
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: 'mongodb://atlas',
    iat: now,
    exp: now + 3600, // 1 hour
    scope: 'https://www.googleapis.com/auth/cloud-platform'
  };
  
  return jwt.sign(payload, serviceAccount.private_key, {
    algorithm: 'RS256',
    keyid: serviceAccount.private_key_id
  });
}
```

### OIDC Connection

```javascript
const { MongoClient } = require('mongodb');

async function connectWithOIDC(jwtToken) {
  const uri = 'mongodb+srv://cluster.mongodb.net/database?authSource=$external&authMechanism=MONGODB-OIDC';
  
  const client = new MongoClient(uri, {
    authMechanism: 'MONGODB-OIDC',
    authSource: '$external',
    authMechanismProperties: {
      REQUEST_TOKEN_CALLBACK: async () => {
        return { accessToken: jwtToken };
      }
    }
  });
  
  await client.connect();
  return client;
}
```

### Token Refresh Implementation

```javascript
class OIDCTokenManager {
  constructor(serviceAccountPath) {
    this.serviceAccountPath = serviceAccountPath;
    this.token = null;
    this.tokenExpiry = null;
  }
  
  async getValidToken() {
    if (!this.token || this.isTokenExpired()) {
      await this.refreshToken();
    }
    return this.token;
  }
  
  isTokenExpired() {
    return !this.tokenExpiry || Date.now() >= this.tokenExpiry - 60000; // 1 min buffer
  }
  
  async refreshToken() {
    this.token = await generateJWTToken(this.serviceAccountPath);
    this.tokenExpiry = Date.now() + 3600000; // 1 hour
  }
}

// Usage
const tokenManager = new OIDCTokenManager('./service-account-key.json');

const client = new MongoClient(uri, {
  authMechanism: 'MONGODB-OIDC',
  authSource: '$external',
  authMechanismProperties: {
    REQUEST_TOKEN_CALLBACK: async () => {
      const token = await tokenManager.getValidToken();
      return { accessToken: token };
    }
  }
});
```

## Cloud Platform Integration

### Google Cloud Functions

```javascript
const { MongoClient } = require('mongodb');

exports.mongoFunction = async (req, res) => {
  // Service account automatically available in Cloud Functions
  const { GoogleAuth } = require('google-auth-library');
  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform']
  });
  
  const client = await auth.getClient();
  const accessToken = await client.getAccessToken();
  
  const mongoClient = new MongoClient(process.env.MONGODB_URI, {
    authMechanism: 'MONGODB-OIDC',
    authSource: '$external',
    authMechanismProperties: {
      REQUEST_TOKEN_CALLBACK: async () => {
        return { accessToken: accessToken.token };
      }
    }
  });
  
  await mongoClient.connect();
  // Database operations...
  await mongoClient.close();
  
  res.json({ success: true });
};
```

### Azure Functions

```javascript
const { DefaultAzureCredential } = require('@azure/identity');

module.exports = async function (context, req) {
  const credential = new DefaultAzureCredential();
  const tokenResponse = await credential.getToken('api://mongodb-atlas');
  
  const client = new MongoClient(process.env.MONGODB_URI, {
    authMechanism: 'MONGODB-OIDC',
    authSource: '$external',
    authMechanismProperties: {
      REQUEST_TOKEN_CALLBACK: async () => {
        return { accessToken: tokenResponse.token };
      }
    }
  });
  
  await client.connect();
  // Database operations...
  await client.close();
  
  context.res = { status: 200, body: { success: true } };
};
```

### AWS Lambda

```javascript
const AWS = require('aws-sdk');

exports.handler = async (event) => {
  // Assume role for OIDC token
  const sts = new AWS.STS();
  const assumedRole = await sts.assumeRoleWithWebIdentity({
    RoleArn: process.env.MONGODB_ROLE_ARN,
    RoleSessionName: 'mongodb-session',
    WebIdentityToken: event.token
  }).promise();
  
  const client = new MongoClient(process.env.MONGODB_URI, {
    authMechanism: 'MONGODB-OIDC',
    authSource: '$external',
    authMechanismProperties: {
      REQUEST_TOKEN_CALLBACK: async () => {
        return { accessToken: assumedRole.Credentials.SessionToken };
      }
    }
  });
  
  await client.connect();
  // Database operations...
  await client.close();
  
  return { statusCode: 200, body: JSON.stringify({ success: true }) };
};
```

## Security Best Practices

1. **Token Expiration**: Use short-lived tokens (1 hour or less)
2. **Scope Limitation**: Grant minimal necessary scopes
3. **Key Rotation**: Regularly rotate service account keys
4. **Network Security**: Use VPC/private endpoints when possible
5. **Audit Logging**: Enable comprehensive audit logs
6. **Secret Management**: Use cloud secret managers for credentials

## MongoDB Shell Equivalent

### Using Service Account with mongosh

```bash
# Set service account credentials
export GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json

# Connect using OIDC
mongosh "mongodb+srv://cluster.mongodb.net/database?authSource=\$external&authMechanism=MONGODB-OIDC"
```

### Manual Token Authentication

```bash
# Generate token manually
TOKEN=$(gcloud auth print-access-token)

# Connect with token
mongosh "mongodb+srv://cluster.mongodb.net/database" \
  --authenticationMechanism MONGODB-OIDC \
  --authenticationDatabase '$external' \
  --username "$TOKEN"
```

## Common Issues and Solutions

### Token Expired

**Error**: `Token expired`

**Solutions**:
- Implement token refresh mechanism
- Check system clock synchronization
- Verify token expiration time
- Ensure proper token generation

### Invalid Audience

**Error**: `Invalid audience`

**Solutions**:
- Verify OIDC audience configuration in Atlas
- Check JWT audience claim matches Atlas config
- Validate identity provider settings
- Review service account permissions

### Authentication Failed

**Error**: `Authentication failed`

**Solutions**:
- Verify service account exists and is active
- Check OIDC provider configuration
- Ensure database user exists with correct identifier
- Validate JWT token structure and signing

## Monitoring and Debugging

### Token Validation

```javascript
const jwt = require('jsonwebtoken');

function validateToken(token) {
  try {
    const decoded = jwt.decode(token, { complete: true });
    console.log('Token Header:', decoded.header);
    console.log('Token Payload:', decoded.payload);
    console.log('Token Expires:', new Date(decoded.payload.exp * 1000));
    return decoded;
  } catch (error) {
    console.error('Token validation failed:', error.message);
    return null;
  }
}
```

### Connection Debugging

```javascript
const client = new MongoClient(uri, {
  authMechanism: 'MONGODB-OIDC',
  authSource: '$external',
  authMechanismProperties: {
    REQUEST_TOKEN_CALLBACK: async () => {
      console.log('Requesting new OIDC token...');
      const token = await getOIDCToken();
      console.log('Token obtained, expires at:', getTokenExpiry(token));
      return { accessToken: token };
    }
  },
  serverSelectionTimeoutMS: 15000,
  // Enable debug logging
  loggerLevel: 'debug'
});
```

## Troubleshooting Checklist

- [ ] Service account key file exists and is valid JSON
- [ ] MongoDB Atlas OIDC authentication is enabled
- [ ] Identity provider is correctly configured
- [ ] Database user exists with service account identifier
- [ ] JWT token is properly signed and not expired
- [ ] Network connectivity allows Atlas access
- [ ] Service account has necessary permissions
- [ ] Token refresh mechanism is implemented

## Usage

You can test the service account authentication using the following methods:

### Using npm scripts:
```bash
# Run service account authentication demo
npm run demo:serviceaccount

# Run all authentication methods
npm run demo:all
```

### Using Node.js directly:
```bash
# Run service account authentication demo
node src/index.js serviceaccount

# Run all authentication methods
node src/index.js all
```

### Implementation File
The service account authentication implementation can be found in: `src/auth-service-account.js`

The main demonstration function is exported as `main` and can be imported as:
```javascript
const { main: demonstrateServiceAccountAuth } = require('./src/auth-service-account');
```

## References 
- [Service Accounts Overview](https://www.mongodb.com/docs/atlas/api/service-accounts-overview/)
- [Generate Service Account Token](https://www.mongodb.com/docs/atlas/api/service-accounts/generate-oauth2-token/#std-label-generate-oauth2-token-atlas)

## Related Topics

- [Password Authentication](./password-authentication.md)
- [Certificate Authentication](./certificate-authentication.md)
- [AWS IAM Authentication](./aws-authentication.md)
- [API Key Authentication](./api-key-authentication.md)