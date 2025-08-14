/**
 * MongoDB Certificate Authentication Demo
 * @fileoverview Demonstrates X.509 certificate authentication with MongoDB
 */

require('dotenv').config();
const fs = require('fs');
const { MongoClient } = require('mongodb');
const DatabaseOperations = require('./shared/database-operations');
const { displayResults, handleError, displayMongoshCommands } = require('./shared/utils');

/**
 * Certificate-based authentication configuration
 */
function configure() {
  const config = {
    uri: process.env.CERT_MONGO_URI,
    cluster: process.env.CERT_MONGO_CLUSTER,
    host: process.env.CERT_MONGO_HOST || 'localhost',
    port: process.env.CERT_MONGO_PORT || 27017,
    database: process.env.CERT_MONGO_DATABASE || 'testdb',
    certFile: process.env.CERT_FILE_PATH || './certs/client.pem',
    caFile: process.env.CA_FILE_PATH || './certs/ca.pem',
    // Subject from certificate used as username
    // certSubject: process.env.CERT_SUBJECT || 'CN=client,OU=MyOrgUnit,O=MyOrg,L=MyCity,ST=MyState,C=US'
  };

  if (!config.uri) {
    let host = config.cluster || `${config.host}:${config.port}`;
    let protocol = config.cluster ? "mongodb+srv" : "mongodb";
    config.uri = `${protocol}://${host}/${config.database}`;
  }

  const options = {
    tls: process.env.CERT_MONGO_TLS === 'true' || !!process.env.CERT_MONGO_CLUSTER,
    tlsCertificateKeyFile: config.certFile,
    tlsCAFile: config.caFile,
    authMechanism: 'MONGODB-X509',
    serverSelectionTimeoutMS: 5000,
  };

  return { config, options };
}

const { config, options } = configure();

/**
 * Validate certificate files exist
 * @returns {boolean} True if certificates are available
 */
function validateCertificates() {
  const certExists = fs.existsSync(config.certFile);
  const caExists = fs.existsSync(config.caFile);

  if (!certExists) {
    console.warn(`⚠️  Certificate file not found: ${config.certFile}`);
  }
  if (!caExists) {
    console.warn(`⚠️  CA file not found: ${config.caFile}`);
  }

  return certExists && caExists;
}

/**
 * Create MongoDB connection using X.509 certificate authentication
 * @returns {Promise<MongoClient>} Connected MongoDB client
 */
async function connectWithCertificate() {
  // Check if certificates exist (for demo purposes, create mock if not available)
  const certsAvailable = validateCertificates();

  if (!certsAvailable) {
    throw new Error('Certificate files not found. Please generate certificates first.');
  }

  // Read certificate files
  // const cert = fs.readFileSync(config.certFile);
  // const ca = fs.readFileSync(config.caFile);
  // const uri = `mongodb://${config.host}:${config.port}/${config.database}`;

  const client = new MongoClient(config.uri, options);

  try {
    await client.connect();
    console.log('✅ Successfully connected using X.509 certificate authentication');
    return client;
  } catch (error) {
    throw new Error(`Certificate authentication failed: ${error.message}`);
  }
}

/**
 * Demonstrate certificate authentication with fallback for demo
 */
async function main() {
  console.log('🔐 MongoDB X.509 Certificate Authentication Demo');
  console.log('===============================================\n');

  // Display mongosh equivalent
  displayMongoshCommands('certificate', {
    uri: `mongodb://${config.host}:${config.port}/${config.database}`,
    certPath: config.certFile,
    caPath: config.caFile
  });

  // Check certificate availability
  const certsAvailable = validateCertificates();

  if (!certsAvailable) {
    console.log('📋 Certificate Authentication Demo (Simulation Mode)');
    console.log('====================================================\n');

    console.log('ℹ️  Certificate files not found. This is expected in a demo environment.');
    console.log('📝 Here\'s what would happen with proper certificates:\n');

    // Simulate the connection process
    console.log('1. 🔍 Loading X.509 certificate and private key...');
    console.log(`   Certificate: ${config.certFile}`);
    console.log(`   CA Certificate: ${config.caFile}`);

    console.log('\n2. 🤝 Establishing TLS connection...');
    console.log('   - TLS handshake with MongoDB server');
    console.log('   - Certificate validation against CA');

    console.log('\n3. 🔐 Authenticating with X.509...');
    console.log(`   - Using certificate subject: ${config.certSubject}`);
    console.log('   - MongoDB validates certificate signature');

    console.log('\n4. ✅ Connection established and authenticated');

    // Simulate database operations
    console.log('\n📋 Database operations that would be performed:');
    displayResults('Simulated Databases', ['admin', 'config', 'local', 'testdb']);
    displayResults('Simulated Collections', ['auth_demo', 'users', 'logs']);

    const simulatedDoc = {
      _id: 'simulated_id',
      timestamp: new Date(),
      authMethod: 'certificate',
      message: 'Hello from certificate authentication!',
      certSubject: config.certSubject
    };
    displayResults('Simulated Inserted Document', simulatedDoc);

    console.log('📚 See documentation for complete certificate setup instructions.');
    return;
  }

  // Actual certificate authentication (if certificates are available)
  let client;

  try {
    client = await connectWithCertificate();

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
      authMethod: 'certificate',
      message: 'Hello from certificate authentication!',
      certSubject: config.certSubject
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

    console.log('✅ Certificate authentication demo completed successfully!');

  } catch (error) {
    handleError(error, 'Certificate Authentication Demo');
    console.log('\n💡 Tip: Ensure certificates are properly generated and MongoDB is configured for X.509 authentication.');
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

module.exports = { connectWithCertificate, main };