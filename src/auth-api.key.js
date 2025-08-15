/**
 * MongoDB API Key Authentication Demo
 * @fileoverview Demonstrates API key authentication with MongoDB Atlas
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');
const DatabaseOperations = require('./shared/database-operations');
const { displayResults, handleError, displayMongoshCommands } = require('./shared/utils');

/**
 * Certificate-based authentication configuration
 */
function configure() {
  const config = {
    uri: process.env.API_KEY_URI,
    // MongoDB Atlas cluster information
    cluster: process.env.API_KEY_CLUSTER || 'cluster0.example.mongodb.net',
    database: process.env.API_KEY_DATABASE || 'test',

    // API Key credentials
    publicKey: process.env.API_KEY_PUBLIC_KEY,
    privateKey: process.env.API_KEY_PRIVATE_KEY
  };

  if (!config.uri) {
    let host = config.cluster || `${config.host}:${config.port}`;
    let protocol = config.cluster ? "mongodb+srv" : "mongodb";
    config.uri = `${protocol}://${encodeURIComponent(config.publicKey)}:${encodeURIComponent(config.privateKey)}@${host}/${config.database}?authSource=$external`;
  }

  const options = {
    serverSelectionTimeoutMS: 10000,
    authMechanism: 'PLAIN',
    authSource: '$external',
    // auth: {
    //   username: config.publicKey,
    //   password: config.privateKey
    // }
  };

  return { config, options };
}

/**
 * API Key authentication configuration
 */
const { config, options } = configure();

/**
 * Validate API key credentials
 * @returns {boolean} True if API keys are available
 */
function validateAPIKeys() {
  const hasKeys = config.publicKey && config.privateKey;

  if (!hasKeys) {
    console.warn('⚠️  MongoDB API keys not found in environment variables');
    console.warn('   Required: API_KEY_PUBLIC_KEY, API_KEY_PRIVATE_KEY');
  }

  return hasKeys;
}

/**
 * Create MongoDB connection using API key authentication
 * @returns {Promise<MongoClient>} Connected MongoDB client
 */
async function connectWithAPIKey() {
  if (!validateAPIKeys()) {
    throw new Error('API keys not configured. Please set API_KEY_PUBLIC_KEY and API_KEY_PRIVATE_KEY.');
  }

  const client = new MongoClient(config.uri, options);

  try {
    await client.connect();
    console.log('✅ Successfully connected using API key authentication');
    return client;
  } catch (error) {
    throw new Error(`API key authentication failed: ${error.message}`);
  }
}

/**
 * Demonstrate API key authentication with fallback for demo
 */
async function main() {
  console.log('🔐 MongoDB API Key Authentication Demo');
  console.log('===================================\n');

  // Display mongosh equivalent
  displayMongoshCommands('apikey', {
    uri: `mongodb+srv://${config.publicKey}:***@${config.cluster}/${config.database}?authSource=$external&authMechanism=MONGODB-X509`,
    username: config.publicKey,
    apiKey: '***'
  });

  // Check API keys availability
  const keysAvailable = validateAPIKeys();

  if (!keysAvailable) {
    console.log('📋 API Key Authentication Demo (Simulation Mode)');
    console.log('===============================================\n');

    console.log('ℹ️  API keys not found. This is expected in a demo environment.');
    console.log('📝 Here\'s what would happen with proper API key setup:\n');

    // Simulate the authentication process
    console.log('1. 🔍 Loading MongoDB Atlas API keys...');
    console.log('   - Public Key: API_KEY_PUBLIC_KEY');
    console.log('   - Private Key: API_KEY_PRIVATE_KEY');

    console.log('\n2. 🤝 Connecting to MongoDB Atlas...');
    console.log(`   - Cluster: ${config.cluster}`);
    console.log('   - Authentication Source: $external');
    console.log('   - Mechanism: MONGODB-X509 or PLAIN');

    console.log('\n3. 🔐 API Key Authentication Process...');
    console.log('   - Atlas validates API key pair');
    console.log('   - Public key identifies the user/application');
    console.log('   - Private key provides authentication proof');
    console.log('   - Permissions determined by API key configuration');

    console.log('\n4. ✅ Connection established with API key permissions');

    // Simulate database operations
    console.log('\n📋 Database operations that would be performed:');
    displayResults('Simulated Databases', ['admin', 'config', 'local', 'testdb']);
    displayResults('Simulated Collections', ['auth_demo', 'users', 'logs']);

    const simulatedDoc = {
      _id: 'simulated_id',
      timestamp: new Date(),
      authMethod: 'api-key',
      message: 'Hello from API key authentication!',
      apiKeyPublic: 'simulated-public-key'
    };
    displayResults('Simulated Inserted Document', simulatedDoc);

    console.log('📚 See documentation for complete API key setup instructions.');
    return;
  }

  // Actual API key authentication (if keys are available)
  let client;

  try {
    console.log('🔍 Validating API key configuration...');
    console.log(`   Public Key: ${config.publicKey.substring(0, 8)}...`);
    console.log('   Private Key: [REDACTED]');

    // Try both authentication methods
    client = await connectWithAPIKey();

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
      authMethod: 'api-key',
      message: 'Hello from API key authentication!',
      apiKeyPublic: config.publicKey
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

    console.log('✅ API key authentication demo completed successfully!');

  } catch (error) {
    handleError(error, 'API Key Authentication Demo');
    console.log('\n💡 Tips:');
    console.log('   - Ensure API keys are properly generated in Atlas');
    console.log('   - Verify API key permissions for database access');
    console.log('   - Check if API key is active and not revoked');
    console.log('   - Validate cluster configuration allows API key auth');
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Connection closed');
    }
  }
}

// Run demo if called directly
if (require.main === module) {
  main();
}

module.exports = {
  connectWithAPIKey,
  main
};