require('dotenv').config();
const client = require('../db-client');

client.query(`
  DROP TABLES IF EXISTS users;
`)
  .then(
    () => console.log('Drop tables complete 🦖'),
    err => console.log(err)
  )
  .then(() => {
    client.end();
  });