require('dotenv').config();
const client = require('../db-client');

client.query(`
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(256) NOT NULL,
    password VARCHAR(256) NOT NULL
  );
`)
  .then(
    () => console.log('Create tables complete 🐳  🐳  🐳'),
    err => console.log(err)
  )
  .then(() => {
    client.end();
  });