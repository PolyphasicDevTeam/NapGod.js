// tests/db-handler.js

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;
const opts = {
    useNewUrlParser: true,
    useUnifiedTopology: true
}

/**
 * Connect to the in-memory database.
 */
module.exports.connect = async () => {
    mongoServer = new MongoMemoryServer();
    const mongoUri = await mongoServer.getUri();
    await mongoose.connect(mongoUri, opts, (err) => {
        if (err) console.error(err);
    });
}

/**
 * Drop database, close the connection and stop mongoServer.
 */
module.exports.closeDatabase = async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
}

/**
 * Remove all the data for all db collections.
 */
module.exports.clearDatabase = async () => {
    const collections = mongoose.connection.collections;

    for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany();
    }
}
