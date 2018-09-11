require('dotenv').config();
const client = require('../db-client');
const boards = require('./boards.json');
const user_categories = require('./categories.json');
const user_clues = require('./clues.json');
const users = require('./users.json');

Promise.all(

  users.map(user => {
    return client.query(`
        INSERT INTO users (name, email, password)
        VALUES ($1, $2, $3);
    `,
    [user.name, user.email, user.password]
    ).then(result => result.rows[0]);
  })
)
  .then(() => {
    return Promise.all(
      boards.map(board => {
        return client.query(`
          INSERT INTO boards (name, user_id)
          VALUES ($1, $2);
      `,
        [board.name, board.user_id]
        ).then(result => result.rows[0]);
      })
    );
  })
  .then(() => {
    return Promise.all(
      user_categories.map(category => {
        return client.query(`
          INSERT INTO user_categories (category, board_id)
          VALUES ($1, $2);
      `,
        [category.category, category.board_id]
        ).then(result => result.rows[0]);
      })
    );
  })
   
  .then(() => {
    return Promise.all(
      user_clues.map(clue => {
        return client.query(`
          INSERT INTO user_clues (clue, answer, value, category_id)
          VALUES ($1, $2, $3, $4);
      `,
        [clue.clue, clue.answer, clue.value, clue.category_id]
        ).then(result => result.rows[0]);
      })
    );
  })
  .then(
    () => console.log('seed data load successful'),
    err => console.error(err)
  )
  .then(() => client.end());