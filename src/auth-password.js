/**
 * MongoDB Password Authentication Demo
 * @fileoverview Demonstrates username/password authentication with MongoDB
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');
const DatabaseOperations = require('./shared/database-operations');
const { displayResults, handleError, displayMongoshCommands } = require('./shared/utils');

/**
 * Password-based authentication configuration
 */
const config = {
  host: process.env.MONGO_HOST || 'localhost',
  port: process.env.MONGO_PORT || 27017,
  username: process.env.MONGO_USERNAME || 'admin',
  password: process.env.MONGO_PASSWORD || 'password',
  authSource: process.env.MONGO_AUTH_SOURCE || 'admin',
  database: process.env.MONGO_DATABASE || 'testdb'
};

/**
 * Create MongoDB connection using password authentication
 * @returns {Promise<MongoClient>} Connected MongoDB client
 */
async function connectWithPassword() {
  const uri = `mongodb://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}?authSource=${config.authSource}`;
  
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 5000,
  });

  try {
    await client.connect();
    console.log('✅ Successfully connected using password authentication');
    return client;
  } catch (error) {
    throw new Error(`Connection failed: ${error.message}`);
  }
}

/**
 * Demonstrate password authentication and basic operations
 */
async function main() {
  let client;
  
  try {
    console.log('🔐 MongoDB Password Authentication Demo');
    console.log('=====================================\n');
    
    // Display mongosh equivalent
    displayMongoshCommands('password', {
      uri: `mongodb://${config.username}:***@${config.host}:${config.port}/${config.database}?authSource=${config.authSource}`,
      host: config.host,
      port: config.port,
      username: config.username,
      authSource: config.authSource
    });
    
    // Connect to MongoDB
    client = await connectWithPassword();
    
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
      authMethod: 'password',
      message: 'Hello from password authentication!',
      user: config.username
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
    
    console.log('✅ Password authentication demo completed successfully!');
    
  } catch (error) {
    handleError(error, 'Password Authentication Demo');
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

module.exports = { connectWithPassword, main };