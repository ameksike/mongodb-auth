# MongoDB Authentication Methods Demo

A comprehensive demonstration of MongoDB authentication methods using JavaScript and Node.js. This project provides practical examples and detailed documentation for each authentication method supported by MongoDB.

## 🚀 Quick Start

```bash
# Clone and setup
git clone <repository-url>
cd mongodb-auth-demo
npm install

# Copy environment template
cp env.example .env

# Run a specific authentication demo
node src/index.js password

# Run all demos
node src/index.js all
```

## 📋 Authentication Methods

| Method | Description | Use Case |
|--------|-------------|----------|
| **Password** | Username/password authentication | Development, basic production setups |
| **Certificate** | X.509 certificate authentication | High-security environments, enterprise |
| **AWS IAM** | AWS credentials authentication | AWS-hosted applications, Atlas |
| **API Key** | Atlas API key authentication | Automation, scripts, CI/CD |
| **Service Account** | OIDC service account authentication | Cloud services, serverless functions |

## 📁 Project Structure

```
mongodb-auth-demo/
├── src/
│   ├── shared/
│   │   ├── database-operations.js    # Common database operations
│   │   └── utils.js                  # Utility functions
│   ├── password-auth.js              # Password authentication demo
│   ├── certificate-auth.js           # Certificate authentication demo
│   ├── aws-auth.js                   # AWS IAM authentication demo
│   ├── api-key-auth.js               # API key authentication demo
│   ├── service-account-auth.js       # Service account authentication demo
│   └── index.js                      # Main entry point
├── doc/
│   ├── password-authentication.md    # Password auth documentation
│   ├── certificate-authentication.md # Certificate auth documentation
│   ├── aws-authentication.md         # AWS auth documentation
│   ├── api-key-authentication.md     # API key auth documentation
│   └── service-account-authentication.md # Service account auth documentation
├── package.json
├── env.example                       # Environment template
└── README.md
```

## 🔧 Setup and Configuration

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp env.example .env
# Edit .env with your credentials
```

### 3. Run Demos

```bash
# Individual authentication methods
node src/index.js password
node src/index.js certificate
node src/index.js aws
node src/index.js apikey
node src/index.js serviceaccount

# All methods
node src/index.js all

# Show available options
node src/index.js
```

## 📚 Documentation

Each authentication method includes:

- **Source Code**: Clean, well-commented JavaScript implementation
- **Documentation**: Step-by-step setup and configuration guide
- **mongosh Examples**: Shell commands for manual testing
- **Best Practices**: Security recommendations and tips
- **Troubleshooting**: Common issues and solutions

### Documentation Files

- [Password Authentication](./doc/password-authentication.md) - Traditional username/password
- [Certificate Authentication](./doc/certificate-authentication.md) - X.509 certificates
- [AWS IAM Authentication](./doc/aws-authentication.md) - AWS credentials for Atlas
- [API Key Authentication](./doc/api-key-authentication.md) - Atlas API keys
- [Service Account Authentication](./doc/service-account-authentication.md) - OIDC service accounts

## 🛠️ Prerequisites by Method

### Password Authentication
- MongoDB server with authentication enabled
- Valid user credentials

### Certificate Authentication
- MongoDB server with TLS/SSL enabled
- X.509 certificates (CA, server, client)
- OpenSSL for certificate generation

### AWS IAM Authentication
- MongoDB Atlas cluster
- AWS account with appropriate IAM permissions
- AWS credentials configured

### API Key Authentication
- MongoDB Atlas account
- Atlas API keys generated
- Project-level permissions configured

### Service Account Authentication
- MongoDB Atlas with OIDC enabled
- Service account credentials (Google Cloud, Azure, etc.)
- Identity provider configuration

## 🔍 Features

### Comprehensive Examples
- Complete connection setup for each method
- Database operations demonstration
- Error handling and retry logic
- Connection pooling configuration

### Educational Focus
- Clear, readable code with minimal dependencies
- Extensive comments explaining key concepts
- Simulation mode when credentials unavailable
- Step-by-step authentication process explanation

### Production Ready
- Environment variable configuration
- Security best practices implementation
- Proper error handling and logging
- Connection cleanup and resource management

## 🚦 Running the Demos

### Individual Method

```bash
# Run password authentication demo
node src/password-auth.js

# Run certificate authentication demo
node src/certificate-auth.js

# Run AWS authentication demo
node src/aws-auth.js

# Run API key authentication demo
node src/api-key-auth.js

# Run service account authentication demo
node src/service-account-auth.js
```

### Using Main Interface

```bash
# Interactive method selection
node src/index.js

# Specific method
node src/index.js [method]

# All methods sequentially
node src/index.js all
```

## 🔧 mongosh Equivalents

Each demo includes equivalent `mongosh` commands for manual testing:

```bash
# Password authentication
mongosh "mongodb://username:password@localhost:27017/testdb?authSource=admin"

# Certificate authentication
mongosh "mongodb://localhost:27017/testdb" --tls --tlsCertificateKeyFile client.pem --tlsCAFile ca.pem

# AWS authentication
export AWS_ACCESS_KEY_ID=your_key
export AWS_SECRET_ACCESS_KEY=your_secret
mongosh "mongodb+srv://cluster.mongodb.net/testdb?authSource=\$external&authMechanism=MONGODB-AWS"

# API key authentication
mongosh "mongodb+srv://public_key:private_key@cluster.mongodb.net/testdb?authSource=\$external"

# Service account authentication
export GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json
mongosh "mongodb+srv://cluster.mongodb.net/testdb?authSource=\$external&authMechanism=MONGODB-OIDC"
```

## 🛡️ Security Considerations

- **Credential Management**: Use environment variables, never hardcode credentials
- **Network Security**: Implement IP allowlists and VPN/VPC when possible
- **Encryption**: Always use TLS/SSL in production environments
- **Least Privilege**: Grant minimal necessary permissions
- **Audit Logging**: Enable comprehensive audit logs
- **Regular Rotation**: Implement credential rotation policies

## 🐛 Troubleshooting

### Common Issues

1. **Connection Timeouts**: Check network connectivity and firewall settings
2. **Authentication Failures**: Verify credentials and user permissions
3. **Certificate Errors**: Validate certificate chains and expiration dates
4. **AWS Permission Errors**: Review IAM policies and roles
5. **OIDC Token Issues**: Check token expiration and identity provider configuration

### Debug Mode

Enable debug logging by setting environment variable:

```bash
DEBUG=true node src/index.js [method]
```

## 📖 Learning Resources

- [MongoDB Authentication Documentation](https://docs.mongodb.com/manual/core/authentication/)
- [MongoDB Atlas Security Features](https://docs.atlas.mongodb.com/security/)
- [Node.js MongoDB Driver Documentation](https://mongodb.github.io/node-mongodb-native/)
- [X.509 Certificate Tutorial](https://docs.mongodb.com/manual/tutorial/configure-x509-client-authentication/)
- [AWS IAM Authentication Guide](https://docs.atlas.mongodb.com/security-aws-iam/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests if applicable
4. Update documentation
5. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details

## 🆘 Support

For questions or issues:

1. Check the documentation in the `doc/` directory
2. Review common troubleshooting steps
3. Open an issue with detailed error information
4. Include environment details and configuration (without credentials)

---

**Note**: This demo is for educational purposes. Always follow security best practices in production environments.