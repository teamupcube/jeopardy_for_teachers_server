require('dotenv').config();
const client = require('../db-client');

client.query(`
  CREATE TABLE IF NOT EXISTS boards (
    id SERIAL PRIMARY KEY,
    name VARCHAR(256) NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    category VARCHAR(256) NOT NULL,
    board_id INTEGER NOT NULL REFERENCES boards(id)
  );

  CREATE TABLE IF NOT EXISTS clues (
    id SERIAL PRIMARY KEY,
    clue VARCHAR(2000) NOT NULL,
    answer VARCHAR(2000) NOT NULL,
    value INTEGER NOT NULL,
    category_id INTEGER NOT NULL REFERENCES categories(id)
  )
`)
  .then(
    () => console.log('create tables complete'),
    err => console.log(err)
  )
  .then(() => {
    client.end();
  });