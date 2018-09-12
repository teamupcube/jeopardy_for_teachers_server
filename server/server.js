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
  const name = body.name;
  const password = body.password;

  if(!name || !password) {
    res.status(400).send({
      error: 'name and password are required'
    });
    return;
  }

  client.query(`
    select count(*)
    from users
    where name = $1
    `,
  [name])
    .then(results => {
      if(results.rows[0].count > 0) {
        res.status(400).send({ error: 'username already in use' });
        return;
      }

      client.query(`
        insert into users(name, password)
        values($1, $2)
        returning id, name
      `,
      [name, password])
        .then(results => {
          res.send(results.rows[0]);
        });
    });
});

app.post('/api/auth/signin', (req, res) => {
  const body = req.body;
  const name = body.name;
  const password = body.password;

  if(!name || !password) {
    res.status(400).send({
      error: 'username and password are required'
    });
    return;
  }

  client.query(`
    SELECT id, name, password
    FROM users
    WHERE name = $1
  `,
  [name]
  )
    .then(results => {
      const row = results.rows[0];
      if(!row || row.password !== password) {
        res.status(401).send({ error: 'invalid username or password' });
        return;
      }
      res.send({
        id: row.id,
        name: row.name
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
  req.userId = id;

  next();
});

app.post('/api/games/:className/:boardId', (req, res, next) => {
  let className = req.params.className;
  let boardId = req.params.boardId;
  if(className === 'error' || boardId === 'error') return next('bad name');
  client.query(`
    INSERT INTO games(class_name, board_id)
    VALUES ($1, $2)
    RETURNING *, board_id as "boardId";
  `,
  [className, boardId]
  ).then(result => {
    res.send(result.rows[0]);
  })
    .catch(next);
});

app.post('/api/teams', (req, res, next) => {
  const body = req.body;
  if(body.teamName === 'error') return next('bad teamName');
  client.query(`
    INSERT INTO teams(team)
    VALUES ($1)
    RETURNING *;
    `,
  [body.teamName]
  ).then(result => {
    res.send(result.rows[0]);
  })
    .catch(next);
});

app.get('/api/me/boards', (req, res, next) => {
  client.query(`
    SELECT id, name
    FROM boards
    WHERE user_id = $1
    ORDER BY id; 
  `,
  [req.userId])
    .then(result => {
      res.send(result.rows);
    })
    .catch(next);
});

// app.get('/api/game', (req,res,next) => {
//   client.query(`
//     SELECT id, class_name
//     FROM games
//     WHERE user_id = $1
//   `)
// })

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


app.get('/api/search/:keywords', (req, res, next) => {
  let keywords = req.params.keywords;
  console.log('req', req.params);
  
  client.query(`
  SELECT c.id, c.round, category, c.value, c.clue, c.answer, airdate
  FROM historic_clues as c
  JOIN historic_airdates ON c.game_id = historic_airdates.id
  JOIN historic_categories ON c.category_id = historic_categories.id
  WHERE category LIKE '%${keywords}%' OR c.clue LIKE '%${keywords}%' OR c.answer LIKE '%${keywords}%'
  ORDER BY(round, category, value);
  `)
    .then(result => {
      res.send(result.rows);
    })
    .catch(next);
});

app.post('/api/me/boards/:board', (req, res, next) => {
  let board = req.params.board;
  console.log('server board board', board);
  if(board === 'error') return next('bad name');

  client.query(`
      INSERT INTO boards (name, user_id)
      VALUES ($1, $2)
      RETURNING *, user_id as "userId";
    `,
  [board, req.userId]
  ).then(result => {
    console.log('result', result.rows[0]);
    res.send(result.rows[0]);
  })
    .catch(next);
});

app.post('/api/me/boards/:board/categories/:category', (req, res, next) => {
  let board = req.params.board;
  let category = req.params.category;
  if(board === 'error' || category === 'error') return next('bad input');

  client.query(`
      INSERT INTO categories (category, board_id)
      VALUES ($1, $2)
      RETURNING *, board_id as "boardId";
    `,
  [category, board]
  ).then(result => {
    console.log('result', result.rows[0]);
    res.send(result.rows[0]);
  })
    .catch(next);
});

app.post('/api/me/categories/:category/clues/:clue/:answer/:value', (req, res, next) => {
  let clue = req.params.clue;
  let answer = req.params.answer;
  let value = req.params.value;
  let category = req.params.category;

  if(clue === 'error' || category === 'error') return next('bad input');

  client.query(`
      INSERT INTO clues (clue, answer, value, category_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *, category_id as "categoryId";
    `,
  [clue, answer, value, category]
  ).then(result => {
    console.log('result', result.rows[0]);
    res.send(result.rows[0]);
  })
    .catch(next);
});


const PORT = process.env.PORT;
app.listen(PORT, () => console.log('server humming along on port', PORT));