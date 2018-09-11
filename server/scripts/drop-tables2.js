require('dotenv').config();
const client = require('../db-client');

client.query(`
  DROP TABLE IF EXISTS boards CASCADE;
  DROP TABLE IF EXISTS user_categories CASCADE;
  DROP TABLE IF EXISTS user_clues CASCADE;
  DROP TABLE IF EXISTS users CASCADE;
`)
  .then(
    () => console.log('drop tables complete'),
    err => console.log(err)
  )
  .then (() => {
    client.end();
  });