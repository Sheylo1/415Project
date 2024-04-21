const { MongoClient } = require("mongodb");
const express = require('express');
const cookieParser = require('cookie-parser');
const ObjectId = require('mongodb').ObjectId;
const session = require('express-session');
const Database = require('./dataContext'); // Adjust the path as per your project structure

const app = express();
const port = 3000;

const database = new Database(); // Creating an instance of the Database singleton

app.listen(port);
console.log('Server started at http://localhost:' + port);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(cookieParser());
app.use(session({ secret: "testwords", resave: false, saveUninitialized: true }));

// Default route:
app.get('/', async function(req, res) {
  try {
    // Check for the existence of a cookie
    if (Object.keys(req.cookies).length > 0 && req.cookies.hasOwnProperty(req.session.userID)) {
      // If a cookie exists for the current user, redirects to welcome page
      res.redirect('/Welcome.html');
    } else {
      // If a cookie does not exist or is invalid, present login or registration form
      res.sendFile(__dirname + '/LoginOrRegister.html');
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send('Internal Server Error');
  }
});


// Serve login or register page:
app.get('/LoginOrRegister.html', function(req, res) {
  res.sendFile(__dirname + '/LoginOrRegister.html');
});

// Route to serve the login page:
app.get('/Login.html', function(req, res) {
  res.sendFile(__dirname + '/Login.html');
});

// Route to serve the comment page:
app.get('/comments.html', function(req, res) {
  res.sendFile(__dirname + '/comments.html');
});


// Route to serve the registration page:
app.get('/Register.html', function(req, res) {
  res.sendFile(__dirname + '/Register.html');
});

// Serve welcome page:
app.get('/Welcome.html', function(req, res) {
  res.sendFile(__dirname + '/Welcome.html');
});

// Route to handle registration:
app.post('/register', async function(req, res) {
  try {
    const { userID, userPASS } = req.body;
    await database.connect();
    const collection = database.getCollection('crlmdb', 'credentials');
    await collection.insertOne({ userID, userPASS });
    console.log("User registered:", userID);
    res.redirect('/Login.html');
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).send('Error during registration');
  } finally {
    await database.close();
  }
});

// Route to handle login requests:
app.post('/login', async function(req, res) {
  try {
    const { userID, userPASS } = req.body;
    await database.connect();
    const collection = database.getCollection('crlmdb', 'credentials');
    const user = await collection.findOne({ userID, userPASS });
    req.session.userID = userID;
    if (user) {
      res.cookie(userID, Date.now(), { maxAge: 300000 });
      console.log("User logged in:", userID);
      res.sendFile(__dirname + '/Welcome.html');
    } else {
      res.send('Invalid username or password. <a href="/">Try again</a>');
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).send('Error during login');
  } finally {
    await database.close();
  }
});

// Route to create a new topic
app.post('/topics', async function(req, res) {
  try {
    const { title, userID } = req.body;
    await database.connect();
    const collection = database.getCollection('crlmdb', 'topics');
    await collection.insertOne({ 
      title,
      createdBy: req.session.userID });
    res.status(201).send('Topic created successfully<br><a href="/Welcome.html">Back to Welcome Page</a>');
  } catch (error) {
    console.error("Error creating topic:", error);
    res.status(500).send('Error creating topic');
  } finally {
    await database.close();
  }
});

// Route to get available topics for subscription
app.get('/topics', async function(req, res) {
  try {
    await database.connect();
    const collection = database.getCollection('crlmdb', 'topics');
    const topics = await collection.find({}).toArray();
    res.status(200).json(topics);
  } catch (error) {
    console.error("Error getting topics:", error);
    res.status(500).send('Error getting topics');
  } finally {
    await database.close();
  }
});

// Route to clear all cookies:
app.get('/clearcookies', function(req, res) {
  const cookies = req.cookies;
  for (const cookie in cookies) {
    res.clearCookie(cookie);
  }
  res.send('Cookies cleared successfully. <br><a href="/reportcookies">View Active Cookies</a> <br><a href="/">Sign Out</a>'); // Confirmation message with links
});

// Route to report cookies:
app.get('/reportcookies', function(req, res) {
  const cookies = req.cookies || {};
  let cookieReport = '';
  for (const cookieName in cookies) {
    if (Object.hasOwnProperty.call(cookies, cookieName) && cookieName !== 'connect.sid') {
      cookieReport += `${cookieName}: ${cookies[cookieName]}<br>`;
    }
  }
  cookieReport += '<br><a href="/Welcome.html">Back to Welcome Page</a> <br><a href="/reportcookies">View Active Cookies</a> <br><a href="/clearcookies">Delete Active Cookies</a>';
  res.send(cookieReport); // Send all active cookies except connect.sid along with the link
});
