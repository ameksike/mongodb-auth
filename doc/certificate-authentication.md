# MongoDB X.509 Certificate Authentication

## Overview

X.509 certificate authentication provides a highly secure method for connecting to MongoDB using digital certificates instead of passwords. This method is particularly useful in enterprise environments where certificate-based authentication is preferred or required.

## Prerequisites

- MongoDB server with TLS/SSL and X.509 authentication enabled
- Valid X.509 certificates (client certificate, private key, and CA certificate)
- OpenSSL or similar tool for certificate generation
- Node.js and npm installed

## Certificate Generation

### 1. Create Certificate Authority (CA)

```bash
# Generate CA private key
openssl genrsa -out ca-key.pem 4096

# Generate CA certificate
openssl req -new -x509 -days 3650 -key ca-key.pem -out ca.pem -subj "/CN=MyCA/OU=MyOrgUnit/O=MyOrg/L=MyCity/ST=MyState/C=US"
```

### 2. Create Server Certificate

```bash
# Generate server private key
openssl genrsa -out server-key.pem 4096

# Generate server certificate signing request
openssl req -new -key server-key.pem -out server.csr -subj "/CN=localhost/OU=MyOrgUnit/O=MyOrg/L=MyCity/ST=MyState/C=US"

# Sign server certificate with CA
openssl x509 -req -days 365 -in server.csr -CA ca.pem -CAkey ca-key.pem -CAcreateserial -out server.pem

# Combine server certificate and key
cat server.pem server-key.pem > server-combined.pem
```

### 3. Create Client Certificate

```bash
# Generate client private key
openssl genrsa -out client-key.pem 4096

# Generate client certificate signing request
openssl req -new -key client-key.pem -out client.csr -subj "/CN=client/OU=MyOrgUnit/O=MyOrg/L=MyCity/ST=MyState/C=US"

# Sign client certificate with CA
openssl x509 -req -days 365 -in client.csr -CA ca.pem -CAkey ca-key.pem -CAcreateserial -out client.pem

# Combine client certificate and key
cat client.pem client-key.pem > client-combined.pem
```

## MongoDB Server Configuration

### 1. Configure mongod.conf

```yaml
net:
  port: 27017
  tls:
    mode: requireTLS
    certificateKeyFile: /path/to/server-combined.pem
    CAFile: /path/to/ca.pem

security:
  authorization: enabled
  clusterAuthMode: x509
```

### 2. Start MongoDB with TLS

```bash
mongod --config /path/to/mongod.conf
```

### 3. Create X.509 User

```javascript
// Connect to MongoDB as admin user first
use $external
db.createUser({
  user: "CN=client,OU=MyOrgUnit,O=MyOrg,L=MyCity,ST=MyState,C=US",
  roles: [
    { role: "readWrite", db: "testdb" },
    { role: "dbAdmin", db: "testdb" }
  ]
})
```

## Environment Variables

Create a `.env` file:

```env
CERT_MONGO_HOST=localhost
CERT_MONGO_PORT=27017
CERT_MONGO_DATABASE=testdb
CERT_FILE_PATH=./certs/client-combined.pem
CA_FILE_PATH=./certs/ca.pem
CERT_SUBJECT=CN=client,OU=MyOrgUnit,O=MyOrg,L=MyCity,ST=MyState,C=US
```

## Connection Configuration

### Node.js Driver Options

```javascript
const client = new MongoClient(uri, {
  tls: true,                              // Enable TLS
  tlsCertificateKeyFile: './certs/client-combined.pem',  // Client cert + key
  tlsCAFile: './certs/ca.pem',           // CA certificate
  authMechanism: 'MONGODB-X509',         // X.509 authentication
  serverSelectionTimeoutMS: 5000,       // Connection timeout
  tlsAllowInvalidCertificates: false,    // Validate certificates (production)
  tlsAllowInvalidHostnames: false        // Validate hostnames (production)
});
```

## Security Best Practices

1. **Certificate Validation**: Always validate certificates in production
2. **Private Key Security**: Protect private keys with appropriate file permissions (600)
3. **Certificate Expiration**: Monitor and renew certificates before expiration
4. **Revocation Lists**: Implement certificate revocation lists (CRL) when needed
5. **Strong Encryption**: Use RSA 2048+ or ECDSA P-256+ for key generation
6. **Certificate Storage**: Store certificates securely, consider using key management systems

## File Structure

```
project/
├── certs/
│   ├── ca.pem                 # Certificate Authority
│   ├── ca-key.pem            # CA Private Key (keep secure!)
│   ├── server-combined.pem    # Server certificate + key
│   ├── client-combined.pem    # Client certificate + key
│   └── client.pem            # Client certificate only
├── src/
│   └── certificate-auth.js   # Authentication demo
└── .env                      # Environment configuration
```

## Common Issues and Solutions

### Certificate Verification Failed

**Error**: `certificate verify failed`

**Solutions**:
- Ensure CA certificate is correctly specified
- Verify certificate chain is complete
- Check certificate hasn't expired
- Validate certificate hostname matches connection

### SSL Handshake Failed

**Error**: `SSL handshake failed`

**Solutions**:
- Verify TLS is enabled on MongoDB server
- Check certificate and key file paths
- Ensure certificates are in correct format (PEM)
- Validate file permissions allow reading

### Authentication Failed

**Error**: `Authentication failed`

**Solutions**:
- Verify user exists in `$external` database
- Check certificate subject matches username exactly
- Ensure user has appropriate roles
- Validate authMechanism is set to 'MONGODB-X509'

## MongoDB Shell Equivalent

### Basic Connection
```bash
mongosh "mongodb://localhost:27017/testdb" \
  --tls \
  --tlsCertificateKeyFile ./certs/client-combined.pem \
  --tlsCAFile ./certs/ca.pem \
  --authenticationMechanism MONGODB-X509
```

### With Authentication Database
```bash
mongosh "mongodb://localhost:27017/testdb?authSource=$external&authMechanism=MONGODB-X509" \
  --tls \
  --tlsCertificateKeyFile ./certs/client-combined.pem \
  --tlsCAFile ./certs/ca.pem
```

### Common Operations
```javascript
// Show current user
db.runCommand({connectionStatus: 1})

// List databases
show dbs

// Work with collections
use testdb
db.auth_demo.find()
```

## Development vs Production

### Development Settings
```javascript
// More permissive for development
{
  tls: true,
  tlsCertificateKeyFile: './certs/client.pem',
  tlsCAFile: './certs/ca.pem',
  tlsAllowInvalidCertificates: true,   // Allow self-signed
  tlsAllowInvalidHostnames: true       // Allow hostname mismatches
}
```

### Production Settings
```javascript
// Strict validation for production
{
  tls: true,
  tlsCertificateKeyFile: './certs/client.pem',
  tlsCAFile: './certs/ca.pem',
  tlsAllowInvalidCertificates: false,  // Require valid certificates
  tlsAllowInvalidHostnames: false,     // Require hostname match
  tlsCRLFile: './certs/crl.pem'       // Certificate revocation list
}
```

## Certificate Management

### Monitoring Certificate Expiration
```bash
# Check certificate expiration
openssl x509 -in client.pem -noout -dates

# Check certificate details
openssl x509 -in client.pem -noout -text
```

### Certificate Renewal Process
1. Generate new certificate with same subject
2. Update MongoDB user if subject changes
3. Deploy new certificate to applications
4. Update MongoDB server certificates
5. Remove old certificates

## Advanced Configuration

### Multiple Certificate Support
```javascript
// Support for multiple client certificates
const client = new MongoClient(uri, {
  tls: true,
  tlsCertificateKeyFile: process.env.NODE_ENV === 'production' 
    ? './certs/prod-client.pem' 
    : './certs/dev-client.pem',
  tlsCAFile: './certs/ca.pem'
});
```

### Certificate-based Role Mapping
```javascript
// Different roles based on certificate
use $external
db.createUser({
  user: "CN=admin-client,OU=Admins,O=MyOrg,C=US",
  roles: [{ role: "root", db: "admin" }]
})

db.createUser({
  user: "CN=app-client,OU=Applications,O=MyOrg,C=US", 
  roles: [{ role: "readWrite", db: "appdb" }]
})
```

## Troubleshooting Checklist

- [ ] MongoDB server has TLS enabled
- [ ] Certificate files exist and are readable
- [ ] Certificate hasn't expired
- [ ] CA certificate is correctly configured
- [ ] User exists in $external database with correct subject
- [ ] Certificate subject matches username exactly
- [ ] Network connectivity allows TLS connections
- [ ] File permissions allow reading certificate files

## Related Topics

- [Password Authentication](./password-authentication.md)
- [AWS IAM Authentication](./aws-authentication.md)
- [API Key Authentication](./api-key-authentication.md)
- [Service Account Authentication](./service-account-authentication.md)