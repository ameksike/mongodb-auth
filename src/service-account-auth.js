/**
 * MongoDB Service Account Authentication Demo
 * @fileoverview Demonstrates service account authentication with MongoDB Atlas using OIDC
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');
const DatabaseOperations = require('./shared/database-operations');
const { displayResults, handleError, displayMongoshCommands } = require('./shared/utils');

/**
 * Service Account authentication configuration
 */
const config = {
  // MongoDB Atlas cluster information
  clusterUrl: process.env.SERVICE_ACCOUNT_MONGO_CLUSTER_URL || 'cluster0.example.mongodb.net',
  database: process.env.SERVICE_ACCOUNT_MONGO_DATABASE || 'testdb',
  
  // Service Account credentials
  serviceAccountKeyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS || './service-account-key.json',
  clientEmail: process.env.SERVICE_ACCOUNT_CLIENT_EMAIL,
  privateKey: process.env.SERVICE_ACCOUNT_PRIVATE_KEY,
  projectId: process.env.SERVICE_ACCOUNT_PROJECT_ID,
  
  // OIDC configuration
  audience: process.env.OIDC_AUDIENCE || 'mongodb://atlas',
  issuer: process.env.OIDC_ISSUER || 'https://accounts.google.com'
};

/**
 * Validate service account credentials
 * @returns {boolean} True if service account credentials are available
 */
function validateServiceAccountCredentials() {
  const fs = require('fs');
  
  // Check if service account key file exists
  const keyFileExists = fs.existsSync(config.serviceAccountKeyFile);
  
  // Check if environment variables are set
  const hasEnvVars = config.clientEmail && config.privateKey && config.projectId;
  
  if (!keyFileExists && !hasEnvVars) {
    console.warn('⚠️  Service account credentials not found');
    console.warn('   Option 1: Set GOOGLE_APPLICATION_CREDENTIALS to service account key file');
    console.warn('   Option 2: Set SERVICE_ACCOUNT_CLIENT_EMAIL, SERVICE_ACCOUNT_PRIVATE_KEY, SERVICE_ACCOUNT_PROJECT_ID');
  }
  
  return keyFileExists || hasEnvVars;
}

/**
 * Generate JWT token for service account authentication
 * @returns {Promise<string>} JWT token
 */
async function generateJWTToken() {
  const jwt = require('jsonwebtoken');
  const fs = require('fs');
  
  let serviceAccountKey;
  
  // Load service account credentials
  if (fs.existsSync(config.serviceAccountKeyFile)) {
    serviceAccountKey = JSON.parse(fs.readFileSync(config.serviceAccountKeyFile, 'utf8'));
  } else {
    serviceAccountKey = {
      client_email: config.clientEmail,
      private_key: config.privateKey.replace(/\\n/g, '\n'),
      project_id: config.projectId
    };
  }
  
  const now = Math.floor(Date.now() / 1000);
  
  const payload = {
    iss: serviceAccountKey.client_email,
    sub: serviceAccountKey.client_email,
    aud: config.audience,
    iat: now,
    exp: now + 3600, // 1 hour expiration
    scope: 'https://www.googleapis.com/auth/cloud-platform'
  };
  
  const token = jwt.sign(payload, serviceAccountKey.private_key, {
    algorithm: 'RS256',
    keyid: serviceAccountKey.private_key_id
  });
  
  return token;
}

/**
 * Create MongoDB connection using service account authentication
 * @returns {Promise<MongoClient>} Connected MongoDB client
 */
async function connectWithServiceAccount() {
  if (!validateServiceAccountCredentials()) {
    throw new Error('Service account credentials not configured.');
  }
  
  try {
    // Generate JWT token for authentication
    const jwtToken = await generateJWTToken();
    
    // MongoDB Atlas connection string with OIDC authentication
    const uri = `mongodb+srv://${config.clusterUrl}/${config.database}?authSource=$external&authMechanism=MONGODB-OIDC`;
    
    const client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 15000,
      authMechanism: 'MONGODB-OIDC',
      authSource: '$external',
      authMechanismProperties: {
        REQUEST_TOKEN_CALLBACK: async () => {
          return { accessToken: jwtToken };
        }
      }
    });

    await client.connect();
    console.log('✅ Successfully connected using service account authentication');
    return client;
    
  } catch (error) {
    throw new Error(`Service account authentication failed: ${error.message}`);
  }
}

/**
 * Alternative: Mock service account authentication for demo
 * @returns {Promise<Object>} Mock connection result
 */
async function mockServiceAccountAuth() {
  console.log('🔍 Simulating service account authentication...');
  
  // Simulate JWT token generation
  const mockPayload = {
    iss: 'service-account@project.iam.gserviceaccount.com',
    sub: 'service-account@project.iam.gserviceaccount.com',
    aud: 'mongodb://atlas',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    scope: 'https://www.googleapis.com/auth/cloud-platform'
  };
  
  console.log('   Generated JWT payload:', JSON.stringify(mockPayload, null, 2));
  
  // Simulate OIDC token exchange
  console.log('   OIDC token exchange: SUCCESS');
  console.log('   MongoDB OIDC validation: SUCCESS');
  
  return {
    connected: true,
    authMethod: 'MONGODB-OIDC',
    serviceAccount: mockPayload.iss
  };
}

/**
 * Demonstrate service account authentication with fallback for demo
 */
async function demonstrateServiceAccountAuth() {
  console.log('🔐 MongoDB Service Account Authentication Demo');
  console.log('===========================================\n');
  
  // Display mongosh equivalent
  displayMongoshCommands('serviceaccount', {
    uri: `mongodb+srv://${config.clusterUrl}/${config.database}?authSource=$external&authMechanism=MONGODB-OIDC`
  });
  
  // Check service account credentials availability
  const credsAvailable = validateServiceAccountCredentials();
  
  if (!credsAvailable) {
    console.log('📋 Service Account Authentication Demo (Simulation Mode)');
    console.log('======================================================\n');
    
    console.log('ℹ️  Service account credentials not found. This is expected in a demo environment.');
    console.log('📝 Here\'s what would happen with proper service account setup:\n');
    
    // Simulate the authentication process
    console.log('1. 🔍 Loading service account credentials...');
    console.log(`   Key File: ${config.serviceAccountKeyFile}`);
    console.log('   Client Email: service-account@project.iam.gserviceaccount.com');
    console.log('   Private Key: [REDACTED]');
    console.log(`   Project ID: ${config.projectId || 'demo-project'}`);
    
    console.log('\n2. 🎫 Generating JWT token...');
    console.log('   - Creating JWT with service account claims');
    console.log('   - Signing with private key (RS256)');
    console.log('   - Setting 1-hour expiration');
    
    console.log('\n3. 🤝 OIDC Authentication Flow...');
    console.log(`   - Audience: ${config.audience}`);
    console.log(`   - Issuer: ${config.issuer}`);
    console.log('   - Token exchange with identity provider');
    console.log('   - MongoDB validates OIDC token');
    
    console.log('\n4. ✅ Connection established with service account permissions');
    
    // Run mock authentication
    const mockResult = await mockServiceAccountAuth();
    displayResults('Mock Authentication Result', mockResult);
    
    // Simulate database operations
    console.log('\n📋 Database operations that would be performed:');
    displayResults('Simulated Databases', ['admin', 'config', 'local', 'testdb']);
    displayResults('Simulated Collections', ['auth_demo', 'users', 'logs']);
    
    const simulatedDoc = {
      _id: 'simulated_id',
      timestamp: new Date(),
      authMethod: 'service-account',
      message: 'Hello from service account authentication!',
      serviceAccount: 'service-account@project.iam.gserviceaccount.com'
    };
    displayResults('Simulated Inserted Document', simulatedDoc);
    
    console.log('📚 See documentation for complete service account setup instructions.');
    return;
  }
  
  // Actual service account authentication (if credentials are available)
  let client;
  
  try {
    console.log('🔍 Validating service account configuration...');
    
    const fs = require('fs');
    if (fs.existsSync(config.serviceAccountKeyFile)) {
      const keyData = JSON.parse(fs.readFileSync(config.serviceAccountKeyFile, 'utf8'));
      console.log(`   Service Account: ${keyData.client_email}`);
      console.log(`   Project ID: ${keyData.project_id}`);
    } else {
      console.log(`   Service Account: ${config.clientEmail}`);
      console.log(`   Project ID: ${config.projectId}`);
    }
    
    client = await connectWithServiceAccount();
    
    // Create database operations instance
    const dbOps = new DatabaseOperations(client);
    
    // Demonstrate operations
    console.log('📋 Performing database operations...\n');
    
    // List databases
    const databases = await dbOps.listDatabases();
    displayResults('Available Databases', databases);
    
    // Use test database
    const testDb = config.database;
    console.log(`🎯 Working with database: ${testDb}`);
    
    // List collections
    const collections = await dbOps.listCollections(testDb);
    displayResults(`Collections in ${testDb}`, collections);
    
    // Insert test document
    const testDoc = {
      timestamp: new Date(),
      authMethod: 'service-account',
      message: 'Hello from service account authentication!',
      serviceAccount: config.clientEmail || 'service-account@project.iam.gserviceaccount.com'
    };
    
    const insertResult = await dbOps.insertTestDocument(testDb, 'auth_demo', testDoc);
    displayResults('Insert Result', { insertedId: insertResult.insertedId });
    
    // Get sample documents
    const sampleDocs = await dbOps.getSampleDocuments(testDb, 'auth_demo', 3);
    displayResults('Sample Documents from auth_demo', sampleDocs);
    
    // Get database stats
    const stats = await dbOps.getDatabaseStats(testDb);
    displayResults('Database Statistics', {
      collections: stats.collections,
      dataSize: `${(stats.dataSize / 1024).toFixed(2)} KB`,
      indexSize: `${(stats.indexSize / 1024).toFixed(2)} KB`,
      objects: stats.objects
    });
    
    console.log('✅ Service account authentication demo completed successfully!');
    
  } catch (error) {
    handleError(error, 'Service Account Authentication Demo');
    console.log('\n💡 Tips:');
    console.log('   - Ensure service account key file is valid JSON');
    console.log('   - Verify service account has necessary permissions');
    console.log('   - Check MongoDB Atlas OIDC configuration');
    console.log('   - Validate network connectivity and DNS resolution');
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Connection closed');
    }
  }
}

// Run demo if called directly
if (require.main === module) {
  demonstrateServiceAccountAuth();
}

module.exports = { 
  connectWithServiceAccount, 
  generateJWTToken,
  demonstrateServiceAccountAuth 
};