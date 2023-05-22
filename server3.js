const express = require('express');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const pool = require('./db');
const BingX = require('./bingx');

const jwt = require('jsonwebtoken');
const ejs = require('ejs')
const XLSX = require('xlsx');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
app.set('view engine', 'ejs');
require("dotenv").config();
const bingx = new BingX(
  process.env.BINGX_API_KEY,
  process.env.BINGX_SECRET_KEY
);

// const bingx = new BingX(apiKey, secretKey);
// const { pool } = require('pg');

// const pool = new Pool({
//   user: 'postgres',
//   host: 'localhost',
//   database: 'my_database',
//   password: 'db_password',
//   port: 5432,
// });

app.use(session({
  secret: 'secret key',
  resave: false,
  saveUninitialized: false
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Define user model
const User = {
  async findByUsername(username) {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    return result.rows[0];
  },
  async findById(id) {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0];
  },
  async register(username, password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *',
      [username, hashedPassword]
    );
    return result.rows[0];
  },
};




// Configure passport authentication
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await User.findByUsername(username);
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

// Routes
app.get('/', (req, res) => {
  res.send('Home page');
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.post(
  '/login',
  passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/login',
  })
);


// app.get('/dashboard', (req, res) => {
//   if (req.isAuthenticated()) {
//     const { id, username } = req.user;
//     const result = pool.query('SELECT * FROM users');
//     const rows = result.rows;
//     res.render('dashboard', { id, username, rows});

//   } else {
//     res.redirect('/login');
//   }
// try {

// } catch (error) {
//   console.error(error);
//   res.status(500).send('Something went wrong');
// }
// });

app.get('/dashboard', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      res.redirect('/login');
      return;
    }

    const { id, username } = req.user;

    // const result = await pool.query('SELECT * FROM users');
    const approve = true
    const result = await pool.query('SELECT * FROM signals  ORDER BY id DESC');
    const result1 = await pool.query('SELECT * FROM signals where approve = $1  ORDER BY id DESC',[approve]);
    const data = result.rows;
    const data1 = result1.rows;
    const currentPage = req.query.page ? parseInt(req.query.page) : 1;
    const rowsPerPage = 10; // Change this to the desired number of rows per page
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const startingIndex = (currentPage - 1) * rowsPerPage;
    const endingIndex = startingIndex + rowsPerPage;
    const slicedData = data.slice(startingIndex, endingIndex);
    // const data1 = result1.rows;
    // console.log(data)
    res.render('dashboard', {
      data: slicedData, // Replace with your actual data array
      currentPage: currentPage,
      rowsPerPage: rowsPerPage,
      startIndex: startIndex,
      endIndex: endIndex,
      data,
      id,
      username,
      data1
    });
    // res.render('dashboard', { data, id, username, data: slicedData, currentPage , rowsPerPage });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
});

app.post('/closeposition', (req, res) => {
  const id = req.body.id; // Retrieve the row's identifier from the form data
  const status = "close_position";
  const query = 'UPDATE signals SET status =$1  WHERE id = $2';
  const values = [status, id];
  pool.query('SELECT symbol , position , status FROM signals WHERE id = $1 ORDER BY id ASC', [id])
    .then(result => {
      const transformedResult = result.rows.map(row => {
        const symbolParts = row.symbol.split('USDT.PS');
        const transformedSymbol = symbolParts.join('-USDT').toUpperCase();
        return { symbol: transformedSymbol };
      });
      console.log(transformedResult[0].symbol);
      const symbolname = transformedResult[0].symbol;
      
      bingx.closePositionBySymbol(symbolname) .then((data) => console.log(data));
      // UPDATE signals SET status =$2  WHERE id = $1 ORDER BY id ASC', [id,status])
      pool.query(query, values, (err, result) => {
        if (err) {
          console.error(err);
          // Handle the error and send an appropriate response
          res.status(500).send('Error updating column1 in the database');
          res.redirect('/dashboard')
        } else {
          // Column 1 was successfully updated
          // Redirect or send a success response as needed
          res.redirect('/dashboard'); // Redirect to the dashboard or any other page
        }
      });

    })
    .catch(error => {
      console.error(error);
    });


});


// Assuming you're using Express.js framework
app.post('/approve', (req, res) => {
  const id = req.body.id; // Retrieve the row's identifier from the form data
  const query = 'UPDATE signals SET approve = $1 WHERE id = $2';
  const values = ['YES', id];
  // Perform the database update for Column 1 using the retrieved id
  pool.query('SELECT symbol , tp_price , sl , position FROM signals WHERE id = $1 ORDER BY id ASC', [id])
    .then(result => {
      // let buy = false;
      // let sell = false;
      const transformedResult = result.rows.map(row => {
        const symbolParts = row.symbol.split('USDT.PS');
        const transformedSymbol = symbolParts.join('-USDT').toUpperCase();
        return { symbol: transformedSymbol };
      });
      console.log(result.rows[0].position)
      console.log(transformedResult[0].symbol);
      console.log(result.rows[0].tp_price)
      console.log(result.rows[0].sl)
      const symbolname = transformedResult[0].symbol
      const tpprice = result.rows[0].tp_price
      const slprice = result.rows[0].sl
      if (result.rows[0].position === 'short') {
        bingx
          .setLeverage({
            symbol: symbolname,
            side: "Short",
            leverage: "5",
          })
        .then((data) => console.log(data));

        bingx.getPrice({ symbol: symbolname })
          .then((result) => {
            const data = result.data;
            const totalPrice = result.totalPrice;
            const leverage = result.Leverage.data.shortLeverage; //result.Leverage.data.longLeverage
            console.log(leverage)
            const volPrice = (totalPrice.data.account.balance / 20) * leverage
            const tradePrice1 = data.data.tradePrice;
            const tradePrice = tradePrice1 - (tradePrice1 / 10000)
            const entrustVolume = volPrice / tradePrice
            console.log(tradePrice)
            console.log(volPrice)
            console.log(entrustVolume)
            bingx.placeOrder({
              symbol: symbolname,
              side: "Ask",
              entrustPrice: tradePrice,
              entrustVolume: entrustVolume,
              tradeType: "Limit",
              action: "Open",
              takerProfitPrice: tpprice,
              stopLossPrice: slprice,
            })
              .then((data) => {
                console.log(data);
                console.log(data.code);
                if (data.code === 0) {
                  pool.query(query, values, (err, result) => {
                    if (err) {
                      console.error(err);
                      // Handle the error and send an appropriate response
                      res.status(500).send('Error updating column1 in the database');
                      res.redirect('/dashboard')
                    } else {
                      // Column 1 was successfully updated
                      // Redirect or send a success response as needed
                      res.redirect('/dashboard'); // Redirect to the dashboard or any other page
                    }
                  });
                }
                if (data.code != 0) {
                  res.redirect('/dashboard');
                }
              })
              .catch((error) => {
                console.error(error);
              });
          })
          .catch((error) => {
            console.error(error);
          });
      }
      if (result.rows[0].position === 'long') {
        bingx
          .setLeverage({
            symbol: symbolname,
            side: "Long",
            leverage: "5",
          })
        .then((data) => console.log(data));

        bingx.getPrice({ symbol: symbolname })
          .then((result) => {
            const data = result.data;
            const totalPrice = result.totalPrice;
            const leverage = result.Leverage.data.longLeverage; //result.Leverage.data.longLeverage
            console.log(leverage)
            const volPrice = (totalPrice.data.account.balance / 20) * leverage
            const tradePrice1 = data.data.tradePrice;
            const tradePrice = tradePrice1 * 1.0001
            const entrustVolume = volPrice / tradePrice
            console.log(tradePrice)
            console.log(volPrice)
            console.log(entrustVolume)
            bingx.placeOrder({
              symbol: symbolname,
              side: "Bid",
              entrustPrice: tradePrice,
              entrustVolume: entrustVolume,
              tradeType: "Limit",
              action: "Open",
              takerProfitPrice: tpprice,
              stopLossPrice: slprice,
            })
              .then((data) => {
                console.log(data);
                console.log(data.code)
                if (data.code === 0) {

                  pool.query(query, values, (err, result) => {
                    if (err) {
                      console.error(err);
                      // Handle the error and send an appropriate response
                      res.status(500).send('Error updating column1 in the database');

                      res.redirect('/dashboard')
                    } else {
                      // Column 1 was successfully updated
                      // Redirect or send a success response as needed
                      res.redirect('/dashboard'); // Redirect to the dashboard or any other page
                    }
                  });
                }
                if (data.code != 0) {
                  res.redirect('/dashboard');
                }

              })
              .catch((error) => {
                console.error(error);
              });
          })
          .catch((error) => {
            console.error(error);
          });

      }

    })
    .catch(error => {
      console.error(error);
    });

  // res.redirect('/dashboard'); // Redirect to the dashboard or any other page




  // const query = 'UPDATE signals SET approve = $1 WHERE id = $2';
  // const values = ['YES', id];

  // pool.query(query, values, (err, result) => {
  //   if (err) {
  //     console.error(err);
  //     // Handle the error and send an appropriate response
  //     res.status(500).send('Error updating column1 in the database');
  //   } else {
  //     // Column 1 was successfully updated
  //     // Redirect or send a success response as needed
  //     res.redirect('/dashboard'); // Redirect to the dashboard or any other page
  //   }
  // });


});


app.get('/logout', (req, res) => {
  req.logout(() => {
    res.redirect('/login');
  });
});

app.get('/register', (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      res.redirect('/login');
      return;
    }
    res.render('register');
  } catch (error) {
    // Handle any potential error that occurs during rendering or redirection
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  // Check if the email is not empty or null
  if (!email) {
    return res.status(400).send('Email is required');
  }
  if (!username) {
    return res.status(400).send('User Name is required');
  }
  if (!password) {
    return res.status(400).send('PassWord is required');
  }
  const user = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
  const user1 = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  if (user.rows.length > 0) {
    return res.status(400).send({ message: 'Username already exists.' });
  }
  if (user1.rows.length > 0) {
    return res.status(400).send({ message: 'email already exists.' });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id',
      [username, email, hashedPassword]
    );
    const user = { id: result.rows[0].id, username, email };
    req.login(user, (err) => {
      if (err) {
        return next(err);
      }
      return res.redirect('/dashboard');
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error registering user');
  }
});

// Handle the form submission and fetch the report data

// app.post('/report', (req, res) => {

//   const start_date = req.body.start_date;
//   const end_date = req.body.end_date;
//   const start_time = req.body.start_time;
//   const end_time = req.body.end_time;

//   const start_datetime = `${start_date} ${start_time}`;
//   const end_datetime = `${end_date} ${end_time}`;

//   const query = `SELECT * FROM signals WHERE date_start::date >= $1::date AND hours_start::time >= $2::time AND date_start::date <= $3::date AND hours_start::time <= $4::time`;
//   const values = [start_date, start_time, end_date, end_time];

//   pool.query(query, values, (error, result) => {
//     if (error) throw error;
//     res.json(result.rows);
//   });
// });


app.post('/report', (req, res) => {
  const start_date = req.body.start_date;
  const end_date = req.body.end_date;
  const start_time = req.body.start_time;
  const end_time = req.body.end_time;

  const start_datetime = `${start_date} ${start_time}`;
  const end_datetime = `${end_date} ${end_time}`;

  const query = `SELECT * FROM signals WHERE date_start::date >= $1::date AND hours_start::time >= $2::time AND date_start::date <= $3::date AND hours_start::time <= $4::time ORDER BY id ASC`;
  const values = [start_date, start_time, end_date, end_time];

  pool.query(query, values, (error, result) => {
    if (error) throw error;

    const rows = result.rows;
    if (rows.length === 0) {
      console.log(rows)
      // Handle case when no rows are found
      res.render('report', { rows: null });
    } else {
      res.render('report', { rows });
    }
  });
});



app.post('/reportexel', (req, res) => {
  const start_date = req.body.start_date;
  const end_date = req.body.end_date;
  const start_time = req.body.start_time;
  const end_time = req.body.end_time;

  const query = `
    SELECT *
    FROM signals
    WHERE date_start::date >= $1::date AND hours_start::time >= $2::time
      AND date_start::date <= $3::date AND hours_start::time <= $4::time ORDER BY id ASC
  `;
  const values = [start_date, start_time, end_date, end_time];

  pool.query(query, values, (error, result) => {
    if (error) throw error;

    // Convert the result to an Excel file
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(result.rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');

    // Save the Excel file
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename="report.xlsx"');
    res.type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(excelBuffer);
  });
});



app.get('/report', (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      res.redirect('/login');
      return;
    }
    const start_date = req.body.start_date;
    const end_date = req.body.end_date;
    const start_time = req.body.start_time;
    const end_time = req.body.end_time;

    const start_datetime = `${start_date} ${start_time}`;
    const end_datetime = `${end_date} ${end_time}`;

    const query = `SELECT * FROM signals WHERE date_start::date >= $1::date AND hours_start::time >= $2::time AND date_start::date <= $3::date AND hours_start::time <= $4::time`;
    const values = [start_date, start_time, end_date, end_time];

    pool.query(query, values, (error, result) => {
      if (error) throw error;

      const rows = result.rows;
      if (rows !== null) {
        res.render('report', { rows });
      } else {
        // Handle case when rows is null
        res.render('report', { rows: [] }); // or pass any other default value you prefer
      }
    });

  } catch (error) {
    // Handle any potential error that occurs during rendering or redirection
    console.error(error);
    res.status(500).send('Internal Server Error');
  }

});
app.listen(3000, () => console.log('Server started on http://localhost:3000'));
