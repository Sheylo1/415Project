const { MongoClient } = require("mongodb");
const express = require('express');
const cookieParser = require('cookie-parser');

const app = express();
const port = 3000;

const uri = "mongodb+srv://ExpressAccount:JvmdZ7svEXsLGfBn@cluster0.xheynkp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

app.listen(port);
console.log('Server started at http://localhost:' + port);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(cookieParser());

// Default route:
app.get('/', function(req, res) {
  // Check for the existence of a cookie
  if (req.cookies.userID) {
    // If a cookie exists, redirects to welcome page
    res.redirect('/Welcome.html');
  } else {
    // If a cookie does not exist, present login or registration form
    res.sendFile(__dirname + '/LoginOrRegister.html');
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
  const { userID, userPASS } = req.body;

  // Connects to MongoDB
  const client = new MongoClient(uri);

  try {
    await client.connect();

    const database = client.db('crlmdb');
    const collection = database.collection('credentials');

    // Insert user data into MongoDB
    await collection.insertOne({ userID, userPASS });
    console.log("User registered:", userID);

    // Redirects to login page after successful registration
    res.redirect('/Login.html');

  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).send('Error during registration');
  } finally {
    await client.close();
  }
});

// Route to handle login requests:
app.post('/login', async function(req, res) {
  const { userID, userPASS } = req.body;

  // Connect to MongoDB
  const client = new MongoClient(uri);

  try {
    await client.connect();

    const database = client.db('crlmdb');
    const collection = database.collection('credentials');

    // Checks if the user exists in the database with the provided credentials
    const user = await collection.findOne({ userID, userPASS });

    if (user) {
      // If the user exists and credentials are valid, set a unique cookie (expires in 1 minute)
      res.cookie(userID, Date.now(), { maxAge: 60000 });
      
      // Log successful login
      console.log("User logged in:", userID);

      // Redirectss to a welcome page or dashboard
      res.sendFile(__dirname + '/Welcome.html');
    } else {
      // If credentials are invalid, show an error message and redirects to login page
      res.send('Invalid username or password. <a href="/LoginOrRegister.html">Try again</a>');
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).send('Error during login');
  } finally {
    await client.close();
  }
});

// Route to access database:
app.get('/api/mongo/:item', async function(req, res) {
  const client = new MongoClient(uri);

  try {
    await client.connect();

    const database = client.db('crlmdb');
    const collection = database.collection('credentials');

    const query = { userID: req.params.item };
    const user = await collection.findOne(query);

    if (user) {
      res.send('Found this: ' + JSON.stringify(user));
    } else {
      res.send('User not found');
    }

  } catch (error) {
    console.error("Error accessing database:", error);
    res.status(500).send('Error accessing database');
  } finally {
    await client.close();
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
  console.log(req.cookies)
  const cookies = req.cookies || {};
  let cookieReport = '';

  // Iterate over all cookies and include them in the report
  for (const cookieName in cookies) {
    if (Object.hasOwnProperty.call(cookies, cookieName)) {
      cookieReport += `${cookieName}: ${cookies[cookieName]}<br>`;
    }
  }
  cookieReport += '<br><a href="/Welcome.html">Back to Welcome Page</a> <br><a href="/clearcookies">Delete Active Cookies</a>';
  res.send(cookieReport); // Send all active cookies along with the link
});
