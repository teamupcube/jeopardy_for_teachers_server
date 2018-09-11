require('dotenv').config();

const express = require('express');
const app = express();

const morgan = require('morgan');
app.use(morgan('dev'));
app.use(express.json());

app.use(express.static('public'));

const client = require('./db-client');

app.post('/api/auth/signup', (req, res) => {
  const body = req.body;
  const email = body.email;
  const password = body.password;

  if(!email || !password) {
    res.status(400).send({
      error: 'email and password are required'
    });
    return;
  }

  client.query(`
    select count(*)
    from users
    where email = $1
    `,
  [email])
    .then(results => {
      if(results.rows[0].count > 0) {
        res.status(400).send({ error: 'email already in use' });
        return;
      }

      client.query(`
        insert into users(email,password)
        values($1, $2)
        returning id, email
      `,
      [email, password])
        .then(results => {
          res.send(results.rows[0]);
        });
    });
});

app.post('/api/auth/signin', (req, res) => {
  const body = req.body;
  const email = body.email;
  const password = body.password;

  if(!email || !password) {
    res.status(400).send({
      error: 'email and password are required'
    });
    return;
  }

  client.query(`
    SELECT id, email, password
    FROM users
    WHERE email = $1
  `,
  [email]
  )
    .then(results => {
      const row = results.rows[0];
      if(!row || row.password !== password) {
        res.status(401).send({ error: 'invalid email or password' });
        return;
      }
      res.send({
        id: row.id,
        email: row.email
      });
    });
});

app.use((req, res, next) => {
  const id = req.get('Authorization');
  if(!id) {
    res.status(403).send({
      error: 'No token found'
    });
    return;
  }
  req.userID = id;

  next();
});

app.get('/api/airdate', (req, res, next) => {
  client.query(`
    SELECT c.id, c.round, category, c.value, c.clue, c.answer, airdate
    FROM historic_clues as c
    JOIN historic_airdates ON c.game_id = historic_airdates.id
    JOIN historic_categories ON c.category_id = historic_categories.id
    WHERE airdate = '2001-07-03'
    ORDER BY(round, category, value);
  `)
    .then(result => {
      res.send(result.rows);
    })
    .catch(next);
});

app.get('/api/search', (req, res, next) => {
  client.query(`
    SELECT c.id, c.round, category, c.value, c.clue, c.answer, airdate
    FROM historic_clues as c
    JOIN historic_airdates ON c.game_id = historic_airdates.id
    JOIN historic_categories ON c.category_id = historic_categories.id
    WHERE category LIKE '%SHERMAN%' OR c.clue LIKE '%Sherman%' OR c.answer LIKE '%Sherman%'
    ORDER BY(round, category, value);
  `)
    .then(result => {
      res.send(result.rows);
    })
    .catch(next);
});




const PORT = process.env.PORT;
app.listen(PORT, () => console.log('server humming along on port', PORT));