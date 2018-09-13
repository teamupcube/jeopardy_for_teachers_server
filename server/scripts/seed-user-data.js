require('dotenv').config();
const client = require('../db-client');
const boards = require('./boards.json');
const categories = require('./categories.json');
const clues = require('./clues.json');
const users = require('./users.json');
const teams = require('./teams.json');
const games = require('./games.json');
const team_game = require('./team_game.json');
const clues_played = require('./clues-played.json');

Promise.all(

  users.map(user => {
    return client.query(`
        INSERT INTO users (name, password)
        VALUES ($1, $2);
    `,
    [user.name, user.password]
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
      categories.map(category => {
        return client.query(`
          INSERT INTO categories (category, board_id)
          VALUES ($1, $2);
      `,
        [category.category, category.board_id]
        ).then(result => result.rows[0]);
      })
    );
  })
   
  .then(() => {
    return Promise.all(
      clues.map(clue => {
        return client.query(`
          INSERT INTO clues (clue, answer, value, category_id)
          VALUES ($1, $2, $3, $4);
      `,
        [clue.clue, clue.answer, clue.value, clue.category_id]
        ).then(result => result.rows[0]);
      })
    );
  })

  .then(() => {
    return Promise.all(
      teams.map(team => {
        return client.query(`
          INSERT INTO teams (team, score)
          VALUES ($1, $2);
      `,
        [team.team, team.score]
        ).then(result => result.rows[0]);
      })
    );
  })

  .then(() => {
    return Promise.all(
      games.map(game => {
        return client.query(`
          INSERT INTO games (class_name, board_id, turn)
          VALUES ($1, $2, $3);
      `,
        [game.class_name, game.board_id, game.turn]
        ).then(result => result.rows[0]);
      })
    );
  })

  .then(() => {
    return Promise.all(
      team_game.map(team_game => {
        return client.query(`
          INSERT INTO team_game (team_id, game_id)
          VALUES ($1, $2);
      `,
        [team_game.team_id, team_game.game_id]
        ).then(result => result.rows[0]);
      })
    );
  })

  .then(() => {
    return Promise.all(
      clues_played.map(clues_played => {
        return client.query(`
          INSERT INTO clues_played (clue_id, game_id)
          VALUES ($1, $2);
      `,
        [clues_played.clue_id, clues_played.game_id]
        ).then(result => result.rows[0]);
      })
    );
  })

  .then(
    () => console.log('seed data load successful'),
    err => console.error(err)
  )
  .then(() => client.end());