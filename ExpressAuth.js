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

// Middleware to check for cookies and route accordingly
app.use((req, res, next) => {
  // Check if the 'authenticated' cookie is set
  if (req.cookies.authenticated) {
    res.redirect('/login'); // Redirect to login page if the user has a cookie
  } else {
    res.redirect('/register'); // Redirect to register page if the user does not have a cookie
  }
});

// Default route:
app.get('/', function(req, res) {
  // This route is not accessed directly by the user.
  // Users are redirected based on cookie status in the middleware.
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

    // Set authenticated cookie after successful registration
    res.cookie('authenticated', true);
    res.redirect('/login'); // Redirect to login page after successful registration

  } catch (error) {
    console.error("Error during registration:", error);
  } finally {
    await client.close();
  }
});

// Route to access database:
app.get('/api/mongo/:item', function(req, res) {
  // Route to access database (unchanged)
});

// Route to serve register page:
app.get('/register', function(req, res) {
  res.sendFile(__dirname + '/register.html');
});

// Route to serve login page:
app.get('/login', function(req, res) {
  res.sendFile(__dirname + '/login.html');
});
