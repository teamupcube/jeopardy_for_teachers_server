require('dotenv').config();
const client = require('../db-client');

client.query(`
  DROP TABLE IF EXISTS boards CASCADE;
  DROP TABLE IF EXISTS categories CASCADE;
  DROP TABLE IF EXISTS clues CASCADE;
  DROP TABLE IF EXISTS users CASCADE;
  DROP TABLE IF EXISTS teams CASCADE;
  DROP TABLE IF EXISTS games CASCADE;
  DROP TABLE IF EXISTS team_game CASCADE;
  DROP TABLE IF EXISTS clues_played CASCADE;
`)
  .then(
    () => console.log('drop tables complete'),
    err => console.log(err)
  )
  .then (() => {
    client.end();
  });