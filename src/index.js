/**
 * MongoDB Authentication Methods Demo - Main Entry Point
 * @fileoverview Demonstrates all MongoDB authentication methods
 */

require('dotenv').config();
const { displayResults, handleError } = require('./shared/utils');

// Import all authentication demos
const { demonstratePasswordAuth } = require('./password-auth');
const { demonstrateCertificateAuth } = require('./certificate-auth');
const { demonstrateAWSAuth } = require('./aws-auth');
const { demonstrateAPIKeyAuth } = require('./api-key-auth');
const { demonstrateServiceAccountAuth } = require('./service-account-auth');

/**
 * Available authentication methods
 */
const authMethods = {
  password: {
    name: 'Password Authentication',
    description: 'Username/password authentication',
    demo: demonstratePasswordAuth
  },
  certificate: {
    name: 'X.509 Certificate Authentication', 
    description: 'Certificate-based authentication',
    demo: demonstrateCertificateAuth
  },
  aws: {
    name: 'AWS IAM Authentication',
    description: 'AWS credentials authentication for Atlas',
    demo: demonstrateAWSAuth
  },
  apikey: {
    name: 'API Key Authentication',
    description: 'Atlas API key authentication',
    demo: demonstrateAPIKeyAuth
  },
  serviceaccount: {
    name: 'Service Account Authentication',
    description: 'OIDC service account authentication',
    demo: demonstrateServiceAccountAuth
  }
};

/**
 * Display available authentication methods
 */
function displayAvailableMethods() {
  console.log('🔐 MongoDB Authentication Methods Demo');
  console.log('====================================\n');
  
  console.log('Available authentication methods:\n');
  
  Object.entries(authMethods).forEach(([key, method]) => {
    console.log(`  ${key.padEnd(15)} - ${method.name}`);
    console.log(`  ${' '.repeat(15)}   ${method.description}\n`);
  });
  
  console.log('Usage:');
  console.log('  node src/index.js [method]');
  console.log('  node src/index.js all       - Run all demos');
  console.log('\nExamples:');
  console.log('  node src/index.js password');
  console.log('  node src/index.js certificate');
  console.log('  node src/index.js all\n');
}

/**
 * Run a specific authentication demo
 * @param {string} method - Authentication method to run
 */
async function runAuthDemo(method) {
  if (!authMethods[method]) {
    console.error(`❌ Unknown authentication method: ${method}`);
    console.error('Run without arguments to see available methods.\n');
    return;
  }
  
  const authMethod = authMethods[method];
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${authMethod.name}`);
  console.log(`${'='.repeat(60)}\n`);
  
  try {
    await authMethod.demo();
  } catch (error) {
    handleError(error, `${authMethod.name} Demo`);
  }
}

/**
 * Run all authentication demos
 */
async function runAllDemos() {
  console.log('🚀 Running All MongoDB Authentication Demos');
  console.log('==========================================\n');
  
  for (const [key, method] of Object.entries(authMethods)) {
    try {
      await runAuthDemo(key);
      console.log('\n' + '─'.repeat(60) + '\n');
    } catch (error) {
      handleError(error, `${method.name} Demo`);
      console.log('\n' + '─'.repeat(60) + '\n');
    }
  }
  
  console.log('✅ All authentication demos completed!');
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    displayAvailableMethods();
    return;
  }
  
  const method = args[0].toLowerCase();
  
  if (method === 'all') {
    await runAllDemos();
  } else {
    await runAuthDemo(method);
  }
}

// Run main function if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Application error:', error.message);
    process.exit(1);
  });
}

module.exports = {
  authMethods,
  runAuthDemo,
  runAllDemos
};