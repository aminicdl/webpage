const express = require('express');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const pool = require('./db');
const jwt = require('jsonwebtoken');
const { types } = require('pg');
const app = express();

// Set up middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'secret key',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());


///////////////////////////////////////////////////////////////////
// let users = [];
// async function myFunction() {
//   const client = await pool.connect();
//   try {
//     const result = await client.query('SELECT * FROM users');
//     users = result.rows;
//     // console.log(result.rows);
//   } finally {
//     client.release();
//   }
// }

// myFunction();


// function findUserByUsername(username) {
//   return users.find(user => user.username === username);
// }
async function findUserByUsername(username) {
  const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
  return result.rows[0];
}
async function validatePassword(password, hash) {
  try {
    const match = await bcrypt.compare(password, hash);
    return match;
  } catch (error) {
    console.log(error);
    return false;
  }
}

// Configure passport authentication
passport.use(new LocalStrategy(async (username, password, done) => {
  const user = findUserByUsername(username);
  if (!user) {
    return done(null, false, { message: 'Incorrect username.' });
  }
  const isValidPassword = validatePassword(password, user.password);
  if (!isValidPassword) {
    return done(null, false, { message: 'Incorrect password.' });
  }
  return done(null, user);
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  const user = users.find(user => user.id === id);
  done(null, user);
});

/////////////////////////////////////




////////////////////////////////

// Define authentication routes
app.post('/login', passport.authenticate('local', {
  successRedirect: '/dashboard',
  failureRedirect: '/login'
}));

// app.post('/login', async (req, res) => {
//   const { username, password } = req.body;
//   console.log(req.body)
//   // Get the user from the database
//   try {
//     const result = await pool.query('SELECT * FROM users WHERE username = $1 and password = $2', [
//       username,password
//     ]);
//     const user = result.rows[0];
//     console.log(user)
//     // Check if the password is correct
//     const validPassword = bcrypt.compare(password, user.password);
//     console.log(validPassword)
//     if (!validPassword) {
//       throw new Error();
//     }

//     // Generate a JWT and send it to the client
//     const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);
//     res.json({ token });
//   } catch (err) {
//     console.error(err);
//     res.status(401).send('Incorrect username or password');
//   }

// });

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Get the user from the database
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];

    // Check if the user exists and the password is correct
    if (!user) {
      throw new Error('Incorrect username or password');
    }
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      throw new Error('Incorrect username or password');
    }

    // Generate a JWT and send it to the client
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(401).send('Incorrect username or password');
  }
});





app.get('/logout', function(req, res){
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});


app.post('/signup', async (req, res) => {

  const { username, email, password } = req.body;
  const user = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
  const user1 = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  if (user.rows.length > 0) {
    return res.status(400).send({ message: 'Username already exists.' });
  }
  if (user1.rows.length > 0) {
    return res.status(400).send({ message: 'email already exists.' });
  }
const hash = await bcrypt.hash(password, 10);
const newUser = { username, email, password: hash };

const query = {
  text: 'INSERT INTO users(username, email, password) VALUES($1, $2, $3) RETURNING id',
  values: [newUser.username, newUser.email, newUser.password],
};
try {
  const result = await pool.query(query);
  newUser.id = result.rows[0].id;
} catch (err) {
  console.error(err);
  return res.status(500).send({ message: 'Error creating user.' });
}
// req.login(newUser, (err) => {
//   if (err) {
//     return res.status(500).send({ message: 'Error logging in user.' });
//   }
//   return res.status(200).send({ message: 'creat new user.' });
  
// });
res.redirect('/logout');
});

/////////////////change pass///////////////////////////////////////

// Define a function to update a user's password
async function updatePassword(userId, newPassword) {
  // Hash the new password
  const hash = await bcrypt.hash(newPassword, 10);

  // Define the database query to update the user's password
  const query = {
    text: 'UPDATE users SET password = $1 WHERE id = $2',
    values: [hash, userId],
  };

  try {
    // Execute the query
    const result = await pool.query(query);

    // Check the number of rows affected
    if (result.rowCount === 1) {
      console.log(`User ${userId} password updated successfully.`);
    } else {
      console.log(`User ${userId} not found.`);
    }
  } catch (err) {
    console.error(err);
  }
}

updatePassword(21, 'adminadmin');
/////////////////////////////////////////////////////////////////
// Define protected routes
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

app.get('/', (req, res) => {
  res.send('Welcome to the homepage');
});

app.get('/dashboard', ensureAuthenticated, (req, res) => {
  res.send(`Welcome, ${req.user.username}!`);
});

app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/login.html');
});

app.get('/signup', (req, res) => {
  res.sendFile(__dirname + '/signup.html');
});

app.get('/chpass', (req, res) => {
  res.sendFile(__dirname + '/chpass.html');
});

// Start the server
app.listen(3000, () => {
  console.log('Server started on port 3000');
});