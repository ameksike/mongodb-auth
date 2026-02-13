const config = {
    uri: process.env.API_KEY_URI,
    // MongoDB Atlas cluster information
    cluster: 'cluster0', //process.env.API_KEY_CLUSTER || 'cluster0.example.mongodb.net',
    database: process.env.API_KEY_DATABASE || 'test',

    // API Key credentials
    publicKey: process.env.API_KEY_PUBLIC_KEY,
    privateKey: process.env.API_KEY_PRIVATE_KEY,
    // Replace with your actual MongoDB Atlas Project ID
    projectId: '685c049c2071af5006930559',
};

(async function map() {
    const auth = Buffer.from(`${config.publicKey}:${config.privateKey}`).toString('base64');
    const url = `https://cloud.mongodb.com/api/atlas/v1.0/groups/${config.projectId}/clusters/${config.cluster}`;

    try {
        // Use Fetch API for HTTP requests
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                Authorization: `Basic ${auth}`,
                'Content-Type': 'application/json',
            },
        });

        // Check if response is successful
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
                `Request failed with status ${response.status}: ${errorData.detail || errorData.error}`
            );
        }

        // Parse response JSON
        const data = await response.json();
        console.log('Cluster Information:', data);
    } catch (error) {
        console.error('Error fetching cluster information:', error.message);
    }
})();
