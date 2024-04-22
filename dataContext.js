const { MongoClient } = require("mongodb");

// MongoDB connection URI
const uri = "mongodb+srv://ExpressAccount:JvmdZ7svEXsLGfBn@cluster0.xheynkp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

class Database {
  constructor() {
    if (!Database.instance) {
      this.client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
      Database.instance = this;
      console.log("Database Context is being accessed");
    }
    return Database.instance;
  }

  async connect() {
    try {
      await this.client.connect();
      console.log("Connected to MongoDB");
    } catch (error) {
      console.error("Error connecting to MongoDB:", error);
    }
  }

  // This grabs the default collections in the database to return for reference
  getCollection(dbName, collectionName) {
    return this.client.db(dbName).collection(collectionName);
  }

  async close() {
    try {
      await this.client.close();
      console.log("MongoDB connection closed");
    } catch (error) {
      console.error("Error closing MongoDB connection:", error);
    }
  }

  // This is where existing topics can be updated to added subscribed users to them
  async updateCollectionSchema() {
    try {
      await this.connect();
      const collection = this.getCollection('crlmdb', 'topics');
      await collection.updateMany({}, { $set: { subscribedUsers: [] } });
      console.log('MongoDB collection schema updated successfully');
    } catch (error) {
      console.error('Error updating MongoDB collection schema:', error);
    } finally {
      await this.close();
    }
  }
}

module.exports = Database;
