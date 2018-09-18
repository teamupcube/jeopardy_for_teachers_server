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

app.use('/api', (req, res, next) => {
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

// 1. Route naming
// If posting a game, route should just be:
// POST /api/games
// If you want to add to a specific class, then:
// POST /api/classes/:classId/games
// 2. Put rest of data (like boardId and class) in body of request
// 3. Prefer id over end-user meaningful names
app.post('/api/games/:className/:boardId', (req, res, next) => {
  let className = req.params.className;
  let boardId = req.params.boardId;
  // This is odd. Why would this even be sent by the app?
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

// Should be POST /api/teams and team name is in body of request.
app.post('/api/teams/:teamName', (req, res, next) => {
  let teamName = req.params.teamName;
  if(teamName === 'error') return next('bad teamName');
  client.query(`
    INSERT INTO teams(team, score)
    VALUES ($1, 0)
    RETURNING *, id as "teamId";
  `,
  [teamName]
  ).then(result => {
    res.send(result.rows[0]);
  })
    .catch(next);
});

// PUT /api/games/:gameId/teams/:teamId
app.post('/api/teams/games/:teamId/:gameId', (req, res, next) => {
  let teamId = req.params.teamId;
  let gameId = req.params.gameId;
  if(teamId === 'error' || gameId === 'error') return next('bad teamId or gameId when adding to team_game');
  client.query(`
    INSERT INTO team_game (team_id, game_id)
    VALUES ($1, $2)
    RETURNING *;
  `,
  [teamId, gameId]
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

// GET /api/teams with query ?gameId=<gameId> 
app.get('/api/teams/:gameId', (req, res, next) => {
  let gameId = req.params.gameId;
  if(gameId === 'error') return next('bad gameId');
  client.query(`
    SELECT teams.team, teams.id
    FROM teams
    JOIN team_game ON team_game.team_id = teams.id
    WHERE team_game.game_id = $1
  `,
  [gameId]
  ).then(result => {
    res.send(result.rows);
  })
    .catch(next);
});

// GET /api/me/games
app.get('/api/games-played', (req, res) => {
  client.query(`
    SELECT DISTINCT games.class_name, games.id
    FROM games
    JOIN boards ON boards.id = games.board_id
    WHERE boards.user_id = $1
    ORDER BY games.id
  `,
  [req.userId]
  )
    .then(result => {
      res.send(result.rows);
    });
});

app.get('/api/scores/:gameId', (req, res, next) => {
  let gameId = req.params.gameId;
  if(gameId === 'error') return next('bad gameId');
  client.query(`
    SELECT teams.id, teams.team, teams.score
    FROM teams
    JOIN team_game ON team_game.team_id = teams.id
    JOIN games ON games.id = team_game.game_id
    WHERE games.id = $1;
  `,
  [gameId]
  ).then(result => {
    res.send(result.rows);
  })
    .catch(next);
});

// this looks essentially like same sql as previous route
app.get('/api/results/:id', (req, res, next) => {
  let gameId = req.params.gameId;
  if(gameId === 'error') return next('bad gameId');
  client.query(`
    SELECT *
    FROM teams
    JOIN team_game on teams.id = team_game.team_id
    JOIN games on games.id = $1
    RETURNING *;
  `,
  [gameId]
  ).then(result => {
    res.send(result.rows[0]);
  })
    .catch(next);
});

// GET /api/clues with query ?airdate=true
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

// Combine with prior route. 
// Same data but filtered is _always_ query param
// GET /api/clues with query ?keyword=<keywords>
app.get('/api/search/:keywords', (req, res, next) => {
  let keywords = req.params.keywords;
  console.log('req', req.params.keywords);
  // SQL Injection Attack! Don't use string concatenation
  // Use $1 params
  client.query(`
    SELECT c.id, c.round, category, c.value, c.clue, c.answer
    FROM historic_clues as c
    JOIN historic_categories ON c.category_id = historic_categories.id
    WHERE category LIKE $1 OR c.clue LIKE $1 OR c.answer LIKE $1
    ORDER BY(round, category, value);
  `,
  [`%${keywords}%`]
  )
    .then(result => {
      res.send(result.rows);
    })
    .catch(next);
});

// GET /api/games/:id/categories
app.get('/api/categories/:id', (req, res, next) => {
  let gameId = req.params.id;
  client.query(`
    SELECT DISTINCT categories.category, clues.category_id
    FROM games as g
    JOIN boards ON g.board_id = boards.id
    JOIN categories ON boards.id = categories.board_id
    JOIN clues ON categories.id = category_id
    WHERE g.id = $1;
  `,
  [gameId]
  ).then(result => {
    res.send(result.rows);
  })
    .catch(next);
});

// Above route already gets categories and clues. How does that differ from this one?
// Either get rid of the one above, or make this more limited (no categories and clues)
app.get('/api/game/:id', (req, res, next) => {
  let gameId = req.params.id;
  client.query(`
    SELECT g.class_name, g.board_id, boards.name, categories.category, clues.category_id, clues.clue, clues.id, clues.answer, clues.value
    FROM games as g
    JOIN boards ON g.board_id = boards.id
    JOIN categories ON boards.id = categories.board_id
    JOIN clues ON categories.id = category_id
    WHERE g.id = $1;
  `,
  [gameId]
  ).then(result => {
    res.send(result.rows);
  })
    .catch(next);
});

// POST /api/me/boards and name is in req body
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

// POST /api/me/boards/:boardId/categories and category is in req.body
app.post('/api/me/boards/:board/categories/:category', (req, res, next) => {
  let board = req.params.board;
  let category = req.params.category;
  if(board === 'error' || category === 'error') return next('bad input');
  
  // you need to validate that this board belongs to this user!
  
  client.query(`
    INSERT INTO categories (category, board_id)
    SELECT 
      $1 as category, 
      b.id as board_id
    FROM boards b
    WHERE b.id = $2
    AND b.user_id = $3
    RETURNING *, board_id as "boardId";
  `,
  [category, board, req.userId]
  ).then(result => {
    console.log('result', result.rows[0]);
    res.send(result.rows[0]);
  })
    .catch(next);
});

// POST /api/me/categories/:categoryId/clues
// Use the req.body to send information, not the path!
app.post('/api/me/categories/:category/clues/:clue/:answer/:value', (req, res, next) => {
  let clue = req.params.clue;
  let answer = req.params.answer;
  let value = req.params.value;
  let category = req.params.category;
  
  if(clue === 'error' || category === 'error') return next('bad input');
  
  // you need to validate that the board of this category belongs to this user!

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

// GET /api/me/boards/:boardId/categories
app.get('/api/me/boards/categories/:id', (req, res, next) => {
  let boardId = req.params.id;

  // you need only return the ones that belong to this user!

  client.query(`
    SELECT DISTINCT categories.category
    FROM boards as b
    JOIN categories ON b.id = categories.board_id
    WHERE b.id = $1
    AND b.user_id = $2;
  `,
  [boardId, req.userId]
  ).then(result => {
    res.send(result.rows);
  })
    .catch(next);
});

// GET /api/me/boards/:id/clues
app.get('/api/me/boards/clues/:id', (req, res, next) => {
  let boardId = req.params.id;

  // /me means only req.userId
  client.query(`
    SELECT boards.name, categories.category, clues.category_id, clues.clue, clues.id, clues.answer, clues.value
    FROM boards
    JOIN categories ON boards.id = categories.board_id
    JOIN clues ON categories.id = category_id
    WHERE boards.id = $1
    AND boards.user_id = $2;
  `,
  [boardId, req.userId]
  ).then(result => {
    res.send(result.rows);
  })
    .catch(next);
});

// GET /api/me/boards/:id/categories/count
app.get('/api/me/boards/categoryNumber/:id', (req, res, next) => {
  let boardId = req.params.id;
  console.log('server', boardId);
  // add req.userId
  client.query(`
    SELECT COUNT(categories.category) as count
    FROM boards as b
    JOIN categories ON b.id = categories.board_id
    WHERE b.id = $1;
  `,
  [boardId]
  ).then(result => {
    console.log('server', res.send({ categoryCount: result.rows[0].count }));
    res.send(result.rows[0]);
  })
    .catch(next);
});

// no verbs in path names!
// DELETE /api/clues-played/:gameId
app.delete('/api/delete-clues-played/:gameId', (req, res, next) => {
  let gameId = req.params.gameId;
  client.query(`
  delete from clues_played where game_id=$1;
  `,
  [gameId]
  ).then(() => {
    res.send({ removed: true });
  })
    .catch(next);
});


// DELETE /api/team-game/:gameId
app.delete('/api/delete-team-game/:gameId', (req, res, next) => {
  let gameId = req.params.gameId;
  client.query(`
  delete from team_game where game_id=$1;
  `,
  [gameId]
  ).then(() => {
    res.send({ removed: true });
  })
    .catch(next);
});

// DELETE /api/games/:id
app.delete('/api/delete-game/:gameId', (req, res, next) => {
  let gameId = req.params.gameId;
  client.query(`
    delete from games where id=$1;
  `,
  [gameId]
  ).then(() => {
    res.send({ removed: true });
  })
    .catch(next);
});

// resources should be _plural_
// PUT /api/games/:gameId and but turn in req.body
app.put('/api/game/:gameId/turn/:turn', (req, res, next) => {
  let gameId = req.params.gameId;
  let turn = req.params.turn;
  if(gameId === 'error' || turn === 'error') return next('bad input');
  client.query(`
  UPDATE games
  SET turn = $2
  WHERE games.id = $1
  RETURNING games.turn;
  `,
  [gameId, turn])
    .then(result => {
      res.send(result.rows);
    })
    .catch(next);
});

// GET /api/games/:id/turn
app.get('/api/get-turn/:id', (req, res, next) => {
  let gameId = req.params.id;
  client.query(`
  SELECT turn
  FROM games
  WHERE games.id = $1;
  `,
  [gameId]
  ).then(result => {
    res.send({ turn: result.rows[0].turn });
  })
    .catch(next);
}),
      
// PUT /api/teams/:teadId/score
app.put('/api/team-id/:teamId/set-score/:newScore', (req, res, next) => {
  let teamId = req.params.teamId;
  let newScore = req.params.newScore;
  if(teamId === 'error' || newScore === 'error') return next('bad input');
  client.query(`
  UPDATE teams
  SET score = $2
  WHERE id = $1;
  `,
  [teamId, newScore]);
});      

// POST /api/clue-played and gameId in req.body
app.post('/api/clue-played/:clueId/game/:gameId', (req, res, next) => {
  let clueId = req.params.clueId;
  let gameId = req.params.gameId;
  if(clueId === 'error' || gameId === 'error') return next('bad name');
  client.query(`
  INSERT INTO clues_played (clue_id, game_id)
  VALUES ($1, $2)
  RETURNING *;
  `,
  [clueId, gameId]
  ).then(result => {
    res.send(result.rows);
  })
    .catch(next);
});

// GET /api/clues-played?gameId=<gameId>, OR
// GET /api/games/:gameId/clues-played
app.get('/api/clues-played/game/:gameId', (req, res, next) => {
  let gameId = req.params.gameId;
  if(gameId === 'error') return next('bad name');
  client.query(`
  SELECT clue_id
  FROM clues_played
  WHERE game_id = $1;
  `,
  [gameId]
  ).then(result => {
    res.send(result.rows);
  })
    .catch(next);
});        
        
app.use((req, res) => {
  res.sendFile('index.html', { root: 'public' }) ;
});
        
const PORT = process.env.PORT;
app.listen(PORT, () => console.log('server humming along on port', PORT));