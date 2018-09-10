require('dotenv').config();
const client = require('../db-client');

client.query(`
  DROP TABLE IF EXISTS boards CASCADE;
  DROP TABLE IF EXISTS categories CASCADE;
  DROP TABLE IF EXISTS clues CASCADE;
`)
  .then(
    () => console.log('drop tables complete'),
    err => console.log(err)
  )
  .then (() => {
    client.end();
  });