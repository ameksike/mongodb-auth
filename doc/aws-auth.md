### Enhanced Step-by-Step Guide to MongoDB Atlas AWS IAM Authentication

This improved and detailed guide walks you through **configuring AWS IAM authentication for MongoDB Atlas**, covering **AWS account setup**, **IAM roles/policies**, **MongoDB Atlas configuration**, and testing the connection using **Node.js** and **MongoDB Shell**. Each point is explained with more context to ensure a smooth setup.

---

## **1. Prerequisites**

To use AWS IAM authentication with MongoDB Atlas, ensure you have the following:
### Tools
- **Node.js** and **npm** (to run JavaScript projects)
  - Install via [Node.js official website](https://nodejs.org)
- **AWS CLI** (to manage AWS services)
  - Install via [AWS CLI Installation Guide](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html)
- **MongoDB Shell (mongosh)** (to interact with MongoDB directly)
  - Download [here](https://www.mongodb.com/try/download/shell)
### Accounts
- An **AWS account** ([Set up a free account](https://aws.amazon.com)) with proper IAM permissions
- A **MongoDB Atlas** account ([Sign up here](https://www.mongodb.com/atlas/sign-up))
### Atlas Cluster
- A running **MongoDB Atlas Cluster** hosted in AWS (AWS IAM authentication is exclusive to clusters hosted on AWS).

---

## **2. Create MongoDB Atlas Cluster**

MongoDB must first be configured to serve as the **source** for authentication via AWS IAM.

1. **Create an Atlas Cluster**
   - Log in to Mongo Atlas Cloud ([Link](https://cloud.mongodb.com)).
   - Click **Build a Database** and choose **AWS** as the cloud provider.
   - Follow on-page instructions to create and configure the Cluster.

2. **Enable AWS IAM Authentication:**
   - Go to **Security > Database Access** in Atlas.
   - Click **Add database user**.
   - Choose **AWS IAM** as the authentication method.
   - In the **IAM ARN field**, add your IAM **Role ARN** or **User ARN**
        - (e.g., `arn:aws:iam::<ACCOUNT_ID>:user/mdb-user`).
        - (e.g., `arn:aws:iam::275662791714:user/mdb-user`).
   - Assign database roles (e.g., `readWrite`).
   ![](./rsc/auth-aws.jpg)
   - Save and apply changes.
   ![](./rsc/auth-methods.jpg)

---

## **3. Configure AWS and IAM**

AWS serves as the authentication provider for IAM-based database access. Let’s configure it step by step.

### **Step 1: Login to AWS**
1. Open the [AWS Management Console](https://aws.amazon.com/console/).
2. Log in using your **AWS credentials** (email/password for AWS root user or IAM user).
3. Configure the default **region** for your account (e.g., *us-east-1*) since this must match the MongoDB Atlas cluster region.

---

### **Step 2: Create IAM Policy**
IAM policy provides permissions for accessing the MongoDB Atlas cluster. Run the following commands in the **AWS CLI**:

#### Command to create IAM policy:
```bash
aws iam create-policy --policy-name MongoDBAtlasAccess \
--policy-document '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "rds-db:connect"
      ],
      "Resource": [
        "arn:aws:rds-db:<AWS_REGION>:<ACCOUNT_ID>:dbuser:cluster-id/mdb-user"
      ]
    }
  ]
}'
```

```sh
aws iam create-policy --policy-name MongoDBAtlasAccess --policy-document file://policy.mdb.access.json

# OUT:
# {
#     "Policy": {
#         "PolicyName": "MongoDBAtlasAccess",
#         "PolicyId": "ANPAUALWIMQRJ7DCXUKVB",
#         "Arn": "arn:aws:iam::275662791714:policy/MongoDBAtlasAccess",
#         "Path": "/",
#         "DefaultVersionId": "v1",
#         "AttachmentCount": 0,
#         "PermissionsBoundaryUsageCount": 0,
#         "IsAttachable": true,
#         "CreateDate": "2020-08-16T14:04:59+00:00",
#         "UpdateDate": "2020-08-16T14:04:59+00:00"
#     }
# }
```

![](./rsc/auth-aws-dashboard.jpg)

#### Key Details:
- Replace `<AWS_REGION>` with your cluster's AWS region.
- Replace `<ACCOUNT_ID>` with your AWS account ID.
- Replace `cluster-id/mdb-user` with your cluster details and database username.

---

### **Step 3: Create IAM User**
An IAM user enables applications or individuals to use AWS authentication resources.

#### Commands to create the IAM user:
```bash
aws iam create-user --user-name mdb-user
# OUT:
# {
#     "User": {
#         "Path": "/",
#         "UserName": "mdb-user",
#         "UserId": "AIDAUALWIMQRFMBBCPCH2",
#         "Arn": "arn:aws:iam::275662791714:user/mdb-user",
#         "CreateDate": "2020-08-16T14:08:52+00:00"
#     }
# }
```
![](./rsc/auth-aws-user.jpg)

```bash
# Ex: aws iam attach-user-policy --user-name mdb-user --policy-arn arn:aws:iam::<ACCOUNT_ID>:policy/<POLICY_NAME>
aws iam attach-user-policy --user-name mdb-user --policy-arn arn:aws:iam::275662791714:policy/MongoDBAtlasAccess
```
```bash
aws iam create-access-key --user-name mdb-user

# OUT: 
# {
#     "AccessKey": {
#         "UserName": "mdb-user",
#         "AccessKeyId": "AKIAUALWIMQRHSKO2QMF",
#         "Status": "Active",
#         "SecretAccessKey": "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",
#         "CreateDate": "2020-08-16T14:12:52+00:00"
#     }
# }
```

```bash
aws iam list-access-keys --user-name mdb-user

# OUT: 
# {
#     "AccessKeyMetadata": [
#         {
#             "UserName": "mdb-user",
#             "AccessKeyId": "AKIAUALWIMQRHSKO2QMF",
#             "Status": "Active",
#             "CreateDate": "2025-08-16T14:12:52+00:00"
#         }
#     ]
# }
```

```bash
aws iam get-user --user-name mdb-user

# OUT:
# {
#     "User": {
#         "Path": "/",
#         "UserName": "mdb-user",
#         "UserId": "AIDAUALWIMQRFMBBCPCH2",
#         "Arn": "arn:aws:iam::275662791714:user/mdb-user",
#         "CreateDate": "2025-08-16T14:08:52+00:00",
#         "Tags": [
#             {
#                 "Key": "mongodb:infosec:creationTime",
#                 "Value": "2025-08-16T14:08:52Z"
#             },
#             {
#                 "Key": "mongodb:infosec:creatorIAMRole",
#                 "Value": "AWSReservedSSO_AdministratorAccess_33cfb77ad9632b7c"
#             },
#             {
#                 "Key": "mongodb:infosec:creator",
#                 "Value": "antonio.membrides@mongodb.com"
#             },
#             {
#                 "Key": "mongodb:infosec:WhatIsThis",
#                 "Value": "https://wiki.corp.mongodb.com/display/SEC/Auto+Tagging"
#             }
#         ]
#     }
# }
```

#### Key Details:
- Replace `<ACCOUNT_ID>` with your AWS account ID.
- Save the generated **Access Key ID** and **Secret Access Key** securely—they’ll be used in the `.env` file.

---

### **Step 4: Create IAM Role for EC2**
If you're running your application on an EC2 instance:
1. Go to **IAM > Roles** in AWS Console.
2. Create a new role for your EC2 instance.
3. Attach the **MongoDBAtlasAccess** policy created earlier.
4. Add this **Role ARN** to MongoDB Atlas.

---

### **Step 5: Configure Credentials**
There are **three main ways** to provide credentials:
1. **Environment Variables** (recommended): Create a `.env` file with the credentials.
2. **AWS CLI Profile**: Store credentials in `~/.aws/credentials` file (use `aws configure`).
3. **IAM Roles**: Use IAM roles directly for applications running on EC2 or Lambda.

---

## **4. Environment Variables**

Create a `.env` file in your project directory to store credentials securely:

```env
AWS_MONGO_CLUSTER_URL=<your-cluster.mongodb.net>
AWS_MONGO_DATABASE=testdb
AWS_ACCESS_KEY_ID=<access-key-id>
AWS_SECRET_ACCESS_KEY=<secret-access-key>
AWS_REGION=us-east-1
```

> **Note**: Avoid hardcoding credentials in your code for security reasons.

---

## **5. Node.js Code for AWS IAM Authentication**

Install required dependencies:
```bash
npm install mongodb aws-sdk dotenv
```

### Authentication Script:
Save the following code as `app.js`:

```javascript
require('dotenv').config();
const { MongoClient } = require('mongodb');
const AWS = require('aws-sdk');

async function connectToMongoDB() {
  const config = {
    clusterUrl: process.env.AWS_MONGO_CLUSTER_URL,
    database: process.env.AWS_MONGO_DATABASE,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
  };

  // Configure AWS credentials
  AWS.config.update({
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    region: config.region,
  });

  const uri = `mongodb+srv://${config.clusterUrl}/${config.database}?authSource=$external&authMechanism=MONGODB-AWS`;

  const client = new MongoClient(uri, {
    authMechanism: 'MONGODB-AWS',
    authSource: '$external',
    serverSelectionTimeoutMS: 10000,
  });

  try {
    await client.connect();
    console.log('✅ Successfully authenticated and connected to MongoDB Atlas.');
    const db = client.db(config.database);
    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections.map((c) => c.name));
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  } finally {
    await client.close();
  }
}

connectToMongoDB();
```

---

## **6. Test MongoDB Connection**

### Run Node.js Script:
Execute the following command in the terminal:
```bash
node app.js
```

### Test Using MongoDB Shell:
Authenticate directly with `mongosh`:
```bash
mongosh "mongodb+srv://<cluster.mongodb.net>/<database>?authSource=$external&authMechanism=MONGODB-AWS"
```

---

## **7. Troubleshooting**

### Common Problems:
1. **Authentication Failure**:
   - Verify AWS credentials (Access Key ID, Secret Access Key).
   - Check MongoDB Atlas network access (whitelist your IP).
   - Ensure your IAM Policy is correctly configured.

2. **Timeouts**:
   - Increase `serverSelectionTimeoutMS` in code.
   - Verify MongoDB Atlas cluster is single-region.

---

## **8. Security Best Practices**

1. Use **IAM roles** for applications running on AWS services (EC2, Lambda).
2. Avoid hard-coding credentials—use `.env` files or **AWS Secrets Manager**.
3. Periodically rotate access keys.
4. Restrict MongoDB access to trusted IPs using **Network Access List** in Atlas.

---

### **End-to-End Setup Summary**

1. **Create MongoDB Atlas Cluster** (AWS-hosted, enable IAM auth).
2. **Create IAM Policy** (Grant permissions for “rds-db:connect”).
3. **Create IAM User** and/or **IAM Role** (Attach the policy).
4. Configure **Environment Variables**.
5. Write authentication code (Node.js example).
6. Test connection with Node.js and MongoDB Shell.

By following these steps, you will successfully integrate MongoDB Atlas AWS IAM authentication on your Windows PC! 🚀