/**
 * MongoDB AWS IAM Authentication Demo
 * @fileoverview Demonstrates AWS IAM authentication with MongoDB Atlas
 */

require('dotenv').config();
const AWS = require('aws-sdk');
const { MongoClient } = require('mongodb');
const DatabaseOperations = require('./shared/database-operations');
const { displayResults, handleError, displayMongoshCommands } = require('./shared/utils');

/**
 * AWS IAM authentication configuration
 */
const config = {
  // MongoDB Atlas cluster information
  clusterUrl: process.env.AWS_MONGO_CLUSTER_URL || 'cluster0.example.mongodb.net',
  database: process.env.AWS_MONGO_DATABASE || 'testdb',
  
  // AWS credentials
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  sessionToken: process.env.AWS_SESSION_TOKEN, // Optional for temporary credentials
  region: process.env.AWS_REGION || 'us-east-1'
};

/**
 * Validate AWS credentials
 * @returns {boolean} True if credentials are available
 */
function validateAWSCredentials() {
  const hasCredentials = config.accessKeyId && config.secretAccessKey;
  
  if (!hasCredentials) {
    console.warn('⚠️  AWS credentials not found in environment variables');
    console.warn('   Required: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY');
    console.warn('   Optional: AWS_SESSION_TOKEN (for temporary credentials)');
  }
  
  return hasCredentials;
}

/**
 * Configure AWS SDK
 */
function configureAWS() {
  AWS.config.update({
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    sessionToken: config.sessionToken,
    region: config.region
  });
}

/**
 * Create MongoDB connection using AWS IAM authentication
 * @returns {Promise<MongoClient>} Connected MongoDB client
 */
async function connectWithAWS() {
  if (!validateAWSCredentials()) {
    throw new Error('AWS credentials not configured. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY.');
  }
  
  configureAWS();
  
  // MongoDB Atlas connection string with AWS IAM authentication
  const uri = `mongodb+srv://${config.clusterUrl}/${config.database}?authSource=$external&authMechanism=MONGODB-AWS`;
  
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 10000, // Increased timeout for AWS authentication
    authMechanism: 'MONGODB-AWS',
    authSource: '$external'
  });

  try {
    await client.connect();
    console.log('✅ Successfully connected using AWS IAM authentication');
    return client;
  } catch (error) {
    throw new Error(`AWS IAM authentication failed: ${error.message}`);
  }
}

/**
 * Demonstrate AWS IAM authentication with fallback for demo
 */
async function demonstrateAWSAuth() {
  console.log('🔐 MongoDB AWS IAM Authentication Demo');
  console.log('====================================\n');
  
  // Display mongosh equivalent
  displayMongoshCommands('aws', {
    uri: `mongodb+srv://${config.clusterUrl}/${config.database}?authSource=$external&authMechanism=MONGODB-AWS`
  });
  
  // Check AWS credentials availability
  const credsAvailable = validateAWSCredentials();
  
  if (!credsAvailable) {
    console.log('📋 AWS IAM Authentication Demo (Simulation Mode)');
    console.log('===============================================\n');
    
    console.log('ℹ️  AWS credentials not found. This is expected in a demo environment.');
    console.log('📝 Here\'s what would happen with proper AWS setup:\n');
    
    // Simulate the authentication process
    console.log('1. 🔍 Loading AWS credentials...');
    console.log('   - Access Key ID: AWS_ACCESS_KEY_ID');
    console.log('   - Secret Access Key: AWS_SECRET_ACCESS_KEY');
    console.log('   - Session Token: AWS_SESSION_TOKEN (if using temporary credentials)');
    console.log(`   - Region: ${config.region}`);
    
    console.log('\n2. 🤝 Connecting to MongoDB Atlas...');
    console.log(`   - Cluster: ${config.clusterUrl}`);
    console.log('   - Authentication Source: $external');
    console.log('   - Mechanism: MONGODB-AWS');
    
    console.log('\n3. 🔐 AWS IAM Authentication Process...');
    console.log('   - MongoDB Atlas validates AWS credentials');
    console.log('   - IAM policies determine database permissions');
    console.log('   - Temporary credentials are generated if needed');
    
    console.log('\n4. ✅ Connection established with IAM permissions');
    
    // Simulate database operations
    console.log('\n📋 Database operations that would be performed:');
    displayResults('Simulated Databases', ['admin', 'config', 'local', 'testdb']);
    displayResults('Simulated Collections', ['auth_demo', 'users', 'logs']);
    
    const simulatedDoc = {
      _id: 'simulated_id',
      timestamp: new Date(),
      authMethod: 'aws-iam',
      message: 'Hello from AWS IAM authentication!',
      awsRegion: config.region,
      awsUser: 'simulated-aws-user'
    };
    displayResults('Simulated Inserted Document', simulatedDoc);
    
    console.log('📚 See documentation for complete AWS IAM setup instructions.');
    return;
  }
  
  // Actual AWS IAM authentication (if credentials are available)
  let client;
  
  try {
    // Test AWS credentials before attempting connection
    console.log('🔍 Validating AWS credentials...');
    const sts = new AWS.STS();
    const identity = await sts.getCallerIdentity().promise();
    console.log(`   AWS User ARN: ${identity.Arn}`);
    console.log(`   AWS Account: ${identity.Account}`);
    
    client = await connectWithAWS();
    
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
      authMethod: 'aws-iam',
      message: 'Hello from AWS IAM authentication!',
      awsRegion: config.region,
      awsUser: identity.Arn
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
    
    console.log('✅ AWS IAM authentication demo completed successfully!');
    
  } catch (error) {
    handleError(error, 'AWS IAM Authentication Demo');
    console.log('\n💡 Tips:');
    console.log('   - Ensure AWS credentials are properly configured');
    console.log('   - Verify MongoDB Atlas cluster allows AWS IAM authentication');
    console.log('   - Check IAM policies grant necessary MongoDB permissions');
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Connection closed');
    }
  }
}

// Run demo if called directly
if (require.main === module) {
  demonstrateAWSAuth();
}

module.exports = { connectWithAWS, demonstrateAWSAuth };