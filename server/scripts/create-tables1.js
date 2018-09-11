require('dotenv').config();
const client = require('../db-client');

client.query(`
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(256) NOT NULL,
    password VARCHAR(256) NOT NULL
  );
  
  CREATE TABLES IF NOT EXISTS teams (
    id SERIAL PRIMARY KEY,
    team VARCHAR(256) NOT NULL,
    game_id INTEGER NOT NULL REFERENCES games(id),
    score INTEGER NOT NULL 
  )

  CREATE TABLE IF NOT EXISTS games(
    id SERIAL PRIMARY KEY,
    class_name VARCHAR(256) NOT NULL,
    board_id INTEGER REFERENCES NOT NULL boards(id), 
    turn INTEGER REFERENCES NOT NULL references teams(id)
  );
`)
  .then(
    () => console.log('Create tables complete 🐳  🐳  🐳'),
    err => console.log(err)
  )
  .then(() => {
    client.end();
  });