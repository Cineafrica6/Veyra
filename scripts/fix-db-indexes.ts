import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const dropLegacyIndexes = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI is not defined in .env');
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('Connected successfully.');

        const db = mongoose.connection.db;
        if (!db) {
            throw new Error('Database connection failed');
        }

        const collections = await db.listCollections().toArray();
        const usersCollection = collections.find(c => c.name === 'users');

        if (usersCollection) {
            console.log('Found "users" collection. Checking indexes...');
            const indexes = await db.collection('users').indexes();
            console.log('Current indexes:', indexes.map(i => i.name));

            const legacyIndexName = 'supabaseId_1';
            const legacyIndexExists = indexes.some(i => i.name === legacyIndexName);

            if (legacyIndexExists) {
                console.log(`Dropping legacy index: ${legacyIndexName}...`);
                await db.collection('users').dropIndex(legacyIndexName);
                console.log('Legacy index dropped successfully.');
            } else {
                console.log(`Index "${legacyIndexName}" not found. No action needed.`);
            }
        } else {
            console.log('"users" collection not found.');
        }

    } catch (error) {
        console.error('Error fixing indexes:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
    }
};

dropLegacyIndexes();
