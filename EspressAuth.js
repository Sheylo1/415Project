var express = require('express');
var cookieParser = require('cookie-parser');
const { MongoClient } = require('mongodb');

var app = express();
app.use(cookieParser());

// Connection string for MongoDB Atlas
const uri = "mongodb+srv://ExpressAccount:JvmdZ7svEXsLGfBn@cluster0.xheynkp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Connect to MongoDB
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// Connect to MongoDB
client.connect(err => {
  if (err) {
    console.error("Error connecting to MongoDB:", err);
    return;
  }
  console.log("Connected to MongoDB");

  const database = client.db('crlmdb');
  const collection = database.collection('cmps415');

  // Default route
  app.get('/', function (req, res) {
    if (!req.cookies.auth) {
      res.send(`
        <h1>Login or Register</h1>
        <form action="/login" method="post">
          <label for="userID">User ID:</label><br>
          <input type="text" id="userID" name="userID"><br>
          <label for="password">Password:</label><br>
          <input type="password" id="password" name="password"><br><br>
          <input type="submit" value="Login">
        </form>
        <br>
        <form action="/register" method="post">
          <label for="userID">Desired User ID:</label><br>
          <input type="text" id="userID" name="userID"><br>
          <label for="password">Desired Password:</label><br>
          <input type="password" id="password" name="password"><br><br>
          <input type="submit" value="Register">
        </form>
      `);
    } else {
      res.send(`
        <h1>Authentication Cookie Exists</h1>
        <p>Cookie Value: ${req.cookies.auth}</p>
      `);
    }
  });

  // Login route
  app.post('/login', (req, res) => {
    const { userID, password } = req.body;
    collection.findOne({ userID, password }, (err, user) => {
      if (err || !user) {
        res.send(`
          <h1>Login Failed</h1>
          <p>Invalid credentials. <a href="/">Go back</a></p>
        `);
      } else {
        res.cookie('auth', userID, { maxAge: 60000 }); // Set cookie to expire in 1 minute
        res.redirect('/');
      }
    });
  });

  // Register route
  app.post('/register', (req, res) => {
    const { userID, password } = req.body;
    collection.insertOne({ userID, password }, (err, result) => {
      if (err) {
        res.send(`<h1>Registration Failed</h1><p>Error: ${err.message}</p>`);
      } else {
        res.cookie('auth', userID, { maxAge: 60000 }); // Set cookie to expire in 1 minute
        res.redirect('/');
      }
    });
  });

  // View cookies route
  app.get('/cookies', (req, res) => {
    res.send(`
      <h1>Active Cookies</h1>
      <p>${JSON.stringify(req.cookies)}</p>
      <p><a href="/">Back to Home</a></p>
    `);
  });

  // Clear cookie route
  app.get('/clear-cookie', (req, res) => {
    res.clearCookie('auth');
    res.send(`
      <h1>Cookie Cleared</h1>
      <p><a href="/">Back to Home</a></p>
    `);
  });

  // Server listening
  var server = app.listen(3000, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log('app listening at %s : %s', host, port);
  });
});
