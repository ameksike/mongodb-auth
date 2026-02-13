
require('dotenv').config();
const { MongoClient } = require('mongodb');

// Replace these with your Service Account's values  
const publicKey = process.env.SERVICE_ACCOUNT_PUBLIC_KEY || process.env.API_KEY_PUBLIC_KEY;
const privateKey = process.env.SERVICE_ACCOUNT_PRIVATE_KEY || process.env.API_KEY_PRIVATE_KEY;

const atlasApiBaseUrl = 'https://cloud.mongodb.com/api/atlas/v1.0';

// Replace this with your Project ID (you can retrieve it from your project's settings in MongoDB Atlas)  
const projectId = 'your-project-id'; // Example: 64a9b1033bd53609e3db0df7  

// Endpoint to get clusters for the project  
const endpoint = `${atlasApiBaseUrl}/groups/${projectId}/clusters`;

(async () => {
    console.log('Fetching clusters using Service Account credentials...');

    try {
        // Create basic auth header
        const authHeader = 'Basic ' + Buffer.from(`${publicKey}:${privateKey}`).toString('base64');

        // Perform API request using fetch
        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': authHeader,
            },
        });

        // Check if the response is successful
        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Clusters:', data);
    } catch (error) {
        console.error('Error fetching clusters:', error.message);
    }
})();


// Credenciales de la cuenta de servicio

const config = {
    uri: `mongodb+srv://cluster0.u23nebu.mongodb.net/?authMechanism=DEFAULT`,
    database: process.env.SERVICE_ACCOUNT_MONGO_DATABASE || 'test',
    clientId: process.env.SERVICE_ACCOUNT_CLIENT_ID,
    clientSecret: process.env.SERVICE_ACCOUNT_CLIENT_SECRET,
};

(async () => {

    const client = new MongoClient(config.uri, {
        auth: {
            username: config.clientId,
            password: config.clientSecret,
        },
        tls: true
    });

    try {
        await client.connect();
        console.log("Conexión exitosa al cluster usando Service Account!");
        const db = client.db(config.database);
        const result = await db.collection("Customers").findOne();
        console.log("Resultado del query: ", result);
    } catch (error) {
        console.error("Error en la conexión:", error);
    } finally {
        await client.close();
    }
})();
