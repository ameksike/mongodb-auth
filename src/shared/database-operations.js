/**
 * Shared database operations for MongoDB authentication demos
 * @fileoverview Common operations to demonstrate connectivity after authentication
 */

const { MongoClient } = require('mongodb');

/**
 * Generic database operations helper
 */
class DatabaseOperations {
  constructor(client) {
    this.client = client;
  }

  /**
   * List all databases
   * @returns {Promise<Array>} List of database names
   */
  async listDatabases() {
    try {
      const result = await this.client.db().admin().listDatabases();
      return result.databases.map(db => db.name);
    } catch (error) {
      throw new Error(`Failed to list databases: ${error.message}`);
    }
  }

  /**
   * List collections in a database
   * @param {string} databaseName - Name of the database
   * @returns {Promise<Array>} List of collection names
   */
  async listCollections(databaseName) {
    try {
      const db = this.client.db(databaseName);
      const collections = await db.listCollections().toArray();
      return collections.map(col => col.name);
    } catch (error) {
      throw new Error(`Failed to list collections: ${error.message}`);
    }
  }

  /**
   * Get sample documents from a collection
   * @param {string} databaseName - Name of the database
   * @param {string} collectionName - Name of the collection
   * @param {number} limit - Number of documents to retrieve (default: 5)
   * @returns {Promise<Array>} Sample documents
   */
  async getSampleDocuments(databaseName, collectionName, limit = 5) {
    try {
      const db = this.client.db(databaseName);
      const collection = db.collection(collectionName);
      return await collection.find({}).limit(limit).toArray();
    } catch (error) {
      throw new Error(`Failed to get sample documents: ${error.message}`);
    }
  }

  /**
   * Insert a test document
   * @param {string} databaseName - Name of the database
   * @param {string} collectionName - Name of the collection
   * @param {Object} document - Document to insert
   * @returns {Promise<Object>} Insert result
   */
  async insertTestDocument(databaseName, collectionName, document) {
    try {
      const db = this.client.db(databaseName);
      const collection = db.collection(collectionName);
      return await collection.insertOne(document);
    } catch (error) {
      throw new Error(`Failed to insert document: ${error.message}`);
    }
  }

  /**
   * Get database statistics
   * @param {string} databaseName - Name of the database
   * @returns {Promise<Object>} Database stats
   */
  async getDatabaseStats(databaseName) {
    try {
      const db = this.client.db(databaseName);
      return await db.stats();
    } catch (error) {
      throw new Error(`Failed to get database stats: ${error.message}`);
    }
  }
}

module.exports = DatabaseOperations;