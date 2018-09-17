require('dotenv').config();
const client = require('../db-client');

client.query(`

  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(256) NOT NULL,
    password VARCHAR(256) NOT NULL
  );

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
  );

  CREATE TABLE IF NOT EXISTS teams (
    id SERIAL PRIMARY KEY,
    team VARCHAR(256) NOT NULL,
    score INTEGER 
  );

  CREATE TABLE IF NOT EXISTS games (
    id SERIAL PRIMARY KEY,
    class_name VARCHAR(256) NOT NULL,
    board_id INTEGER NOT NULL REFERENCES boards(id),
    turn VARCHAR(256)
  );

  CREATE TABLE IF NOT EXISTS team_game (
    id SERIAL PRIMARY KEY,
    team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE, 
    game_id INTEGER NOT NULL REFERENCES games(id)
  );

  CREATE TABLE IF NOT EXISTS clues_played (
    id SERIAL PRIMARY KEY,
    clue_id INTEGER NOT NULL REFERENCES clues(id),
    game_id INTEGER NOT NULL REFERENCES games(id),
    team_id INTEGER REFERENCES teams(id),
    turn_result INTEGER 
  );

`)
  .then(
    () => console.log('create tables complete'),
    err => console.log(err)
  )
  .then(() => {
    client.end();
  });