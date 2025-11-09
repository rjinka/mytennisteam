import { MongoMemoryServer } from 'mongodb-memory-server';
import { app, startServer } from './server.js';
import { config } from './config.js';

const start = async () => {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  config.mongo_uri = uri;
  await startServer();
};

start();
