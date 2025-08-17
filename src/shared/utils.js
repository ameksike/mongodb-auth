/**
 * Utility functions for MongoDB authentication demos
 */

/**
 * Pretty print results to console
 * @param {string} title - Title for the output
 * @param {*} data - Data to display
 */
function displayResults(title, data) {
  console.log('\n' + '='.repeat(50));
  console.log(`  ${title}`);
  console.log('='.repeat(50));

  if (Array.isArray(data)) {
    if (data.length === 0) {
      console.log('No results found');
    } else {
      data.forEach((item, index) => {
        console.log(`${index + 1}. ${typeof item === 'object' ? JSON.stringify(item, null, 2) : item}`);
      });
    }
  } else if (typeof data === 'object') {
    console.log(JSON.stringify(data, null, 2));
  } else {
    console.log(data);
  }
  console.log('='.repeat(50) + '\n');
}

/**
 * Handle errors gracefully
 * @param {Error} error - Error object
 * @param {string} context - Context where error occurred
 */
function handleError(error, context) {
  console.error(`\n❌ Error in ${context}:`);
  console.error(`   ${error.message}`);
  if (error.stack && process.env.DEBUG) {
    console.error(`   Stack: ${error.stack}`);
  }
}

/**
 * Display mongosh equivalent commands
 * @param {string} authMethod - Authentication method
 * @param {Object} connectionInfo - Connection information
 */
function displayMongoshCommands(authMethod, connectionInfo) {
  console.log('\n' + '='.repeat(60));
  console.log(`  MONGOSH EQUIVALENT FOR ${authMethod.toUpperCase()}`);
  console.log('='.repeat(60));

  switch (authMethod) {
    case 'password':
      console.log(`mongosh "mongodb://<username>:<password>@<host>:<port>/<database>?authSource=admin"`);
      console.log(`mongosh "mongodb+srv://<username>:<password>@<cluster>/<database>?authSource=admin"`);
      console.log(`mongosh "${connectionInfo.uri}"`);
      console.log('// Or with explicit parameters:');
      console.log(connectionInfo.cmd || `mongosh --host ${connectionInfo.cluster || `${connectionInfo.host} --port ${connectionInfo.port}`} --username ${connectionInfo.username} --password --authenticationDatabase ${connectionInfo.authSource}`);
      break;

    case 'certificate':
      console.log(connectionInfo.cmd || `mongosh "${connectionInfo.uri}" --tls --tlsCertificateKeyFile ${connectionInfo.certPath} --tlsCAFile ${connectionInfo.caPath}`);
      break;

    case 'aws':
      console.log('// Set AWS credentials first:');
      console.log('// export AWS_ACCESS_KEY_ID=your_access_key');
      console.log('// export AWS_SECRET_ACCESS_KEY=your_secret_key');
      console.log(connectionInfo.cmd || `mongosh "${connectionInfo.uri}" --authenticationMechanism MONGODB-AWS`);
      break;

    case 'apikey':
      console.log(connectionInfo.cmd || `mongosh "${connectionInfo.uri}"`);
      break;

    case 'serviceaccount':
      console.log('// Set service account key file:');
      console.log('// export GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json');
      console.log(connectionInfo.cmd || `mongosh "${connectionInfo.uri}" --authenticationMechanism MONGODB-OIDC`);
      break;
  }

  console.log('\n// Common operations after connection:');
  console.log('show dbs                    // List databases');
  console.log('use myDatabase              // Switch to database');
  console.log('show collections            // List collections');
  console.log('db.myCollection.find()      // Query collection');
  console.log('='.repeat(60) + '\n');
}

module.exports = {
  displayResults,
  handleError,
  displayMongoshCommands
};