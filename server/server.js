require('dotenv').config();

const express = require('express');
const app = express();

const morgan = require('morgan');
app.use(morgan('dev'));
app.use(express.json());

app.use(express.static('public'));

const client = require('./db-client');

app.get('/api/airdate', (req, res, next) => {
  client.query(`
    SELECT clues.id, clues.round, category, clues.value, clues.clue, clues.answer, airdate
    FROM clues
    JOIN airdates ON clues.game_id = airdates.id
    JOIN categories ON clues.category_id = categories.id
    WHERE airdate = '2001-07-03'
    ORDER BY(round, category, value);
  `)
    .then(result => {
      res.send(result.rows);
    })
    .catch(next);
});

const PORT = process.env.PORT;
app.listen(PORT, () => console.log('server humming along on port', PORT));