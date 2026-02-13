/**
 * MongoDB API Key Authentication Demo
 * @fileoverview Demonstrates API key authentication with MongoDB Atlas
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');
const DatabaseOperations = require('./shared/database-operations');
const { displayResults, handleError, displayMongoshCommands } = require('./shared/utils');

/**
 * API Key authentication configuration
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

  // Build URI dynamically if not provided explicitly
  if (!config.uri) {
    let host = config.cluster;
    let protocol = config.cluster ? "mongodb+srv" : "mongodb";
    config.uri = `${protocol}://${encodeURIComponent(config.publicKey)}:${encodeURIComponent(config.privateKey)}@${host}/${config.database}?authSource=$external&authMechanism=PLAIN`;
  }

  // MongoDB connection options
  const options = {
    serverSelectionTimeoutMS: 10000,
    // authMechanism: 'PLAIN',
    // authSource: '$external',
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

  if (!config.publicKey) {
    console.warn('⚠️ Missing API_KEY_PUBLIC_KEY in environment variables.');
  }

  if (!config.privateKey) {
    console.warn('⚠️ Missing API_KEY_PRIVATE_KEY in environment variables.');
  }

  if (!hasKeys) {
    console.warn('⚠️ MongoDB API keys are required for authentication.');
  }

  return hasKeys;
}

/**
 * Create MongoDB connection using API key authentication
 * @returns {Promise<MongoClient>} Connected MongoDB client
 */
async function connectWithAPIKey() {
  if (!validateAPIKeys()) {
    throw new Error('API keys are not configured. Please set API_KEY_PUBLIC_KEY and API_KEY_PRIVATE_KEY.');
  }

  const client = new MongoClient(config.uri, options);

  try {
    await client.connect();
    console.log('✅ Successfully connected using API key authentication');
    return client;
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error);
    throw new Error(`API key authentication failed: ${error.message}`);
  }
}

/**
 * Demonstrate API key authentication
 */
async function main() {
  console.log('🔐 MongoDB API Key Authentication Demo');
  console.log('===================================\n');

  // Display mongosh equivalent for diagnostic purposes
  displayMongoshCommands('apikey', config);

  // Validate API keys
  const keysAvailable = validateAPIKeys();

  if (!keysAvailable) {
    console.log('\nℹ️ API keys are missing. Demo cannot connect to MongoDB Atlas.');
    console.log('📝 Please ensure proper API key setup in your environment variables.');
    return;
  }

  let client;

  try {
    console.log('🔍 Validating API key configuration...');
    console.log(`   Public Key: ${config.publicKey.substring(0, 4)}****`);
    console.log('   Private Key: [REDACTED]');

    // Attempt connection
    client = await connectWithAPIKey();

    // Create database operations instance
    const dbOps = new DatabaseOperations(client);

    // Demonstrate operations
    console.log('📋 Performing database operations...\n');

    // List databases
    const databases = await dbOps.listDatabases();
    displayResults('Available Databases', databases);

    // Select test database
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
      apiKeyPublic: config.publicKey,
    };

    const insertResult = await dbOps.insertTestDocument(testDb, 'auth_demo', testDoc);
    displayResults('Insert Result', { insertedId: insertResult.insertedId });

    // Retrieve sample documents
    const sampleDocs = await dbOps.getSampleDocuments(testDb, 'auth_demo', 3);
    displayResults('Sample Documents from auth_demo', sampleDocs);

    // Get database stats
    const stats = await dbOps.getDatabaseStats(testDb);
    displayResults('Database Statistics', {
      collections: stats.collections,
      dataSize: `${(stats.dataSize / 1024).toFixed(2)} KB`,
      indexSize: `${(stats.indexSize / 1024).toFixed(2)} KB`,
      objects: stats.objects,
    });

    console.log('✅ API key authentication demo completed successfully!');
  } catch (error) {
    // Handle errors gracefully
    handleError(error, 'API Key Authentication Demo');
    console.log('\n💡 Tips:');
    console.log('   - Ensure API keys are properly generated in Atlas');
    console.log('   - Verify API key permissions for database access');
    console.log('   - Check if API key is active and not revoked');
    console.log('   - Validate cluster configuration allows API key authentication');
  } finally {
    if (client) {
      try {
        await client.close();
        console.log('🔌 Connection closed successfully');
      } catch (closeError) {
        console.error('❌ Error closing connection:', closeError.message);
      }
    }
  }
}

// Run demo if called directly  
if (require.main === module) {
  main().catch((err) => {
    console.error('❌ An unexpected error occurred:', err.message);
    process.exit(1);
  });
}

module.exports = {
  connectWithAPIKey,
  main,
};  
