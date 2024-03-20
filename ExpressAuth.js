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
  // Route to the register page
  res.sendFile(__dirname + '/register.html');
});

// Route to serve the login page:
app.get('/login.html', function(req, res) {
  res.sendFile(__dirname + '/login.html');
});

// Route to handle registration:
app.post('/register', async function(req, res) {
  const { userID, userPASS } = req.body;

  // Connect to MongoDB
  const client = new MongoClient(uri);

  try {
    await client.connect();

    const database = client.db('crlmdb');
    const collection = database.collection('credentials');

    // Insert user data into MongoDB
    await collection.insertOne({ userID, userPASS });
    console.log("User registered:", userID);

    // Redirect to login page after successful registration
    res.redirect('/login.html');

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

    // Check if the user exists in the database with the provided credentials
    const user = await collection.findOne({ userID, userPASS });

    if (user) {
      // If user exists and credentials are valid, set authentication cookie (expires in 1 hour)
      res.cookie('auth', 'authenticated', { maxAge: 3600000 });
      
      // Log successful login
      console.log("User logged in:", userID);

      // Redirect to a welcome page or dashboard
      res.redirect(__dirname + '/welcome.html');
    } else {
      // If credentials are invalid, show an error message and redirect to login page
      res.send('Invalid username or password. <a href="/login.html">Try again</a>');
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
