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
app.use(express.static('public')); // This line tells Express to serve static files from the 'public' folder
app.use(cookieParser()); // Adding cookie-parser middleware

// Default route:
app.get('/', function(req, res) {
  // Check if the authentication cookie exists
  if (req.cookies.authenticated) {
    // If the authentication cookie exists, route to the login page
    res.sendFile(__dirname + '/login.html');
  } else {
    // If the authentication cookie does not exist, route to the register page
    res.sendFile(__dirname + '/register.html');
  }
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
    const result = await collection.insertOne({ userID, userPASS });
    console.log("User registered:", result.ops[0]);

    res.send('User registered successfully!');
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).send('Error during registration');
  } finally {
    await client.close();
  }
});

// Route to access database:
app.get('/api/mongo/:item', function(req, res) {
  const client = new MongoClient(uri);
  const searchKey = "{ userID: '" + req.params.item + "' }"; // Adjusted to userID
  console.log("Looking for: " + searchKey);

  async function run() {
    try {
      const database = client.db('crlmdb');
      const parts = database.collection('credentials');

      // Hardwired Query for a part that has userID '12345'
      // const query = { userID: '12345', userPASS: 'password' };
      // But we will use the parameter provided with the route
      const query = { userID: req.params.item };

      const part = await parts.findOne(query);
      console.log(part);
      res.send('Found this: ' + JSON.stringify(part));  //Use stringify to print a json

    } finally {
      // Ensures that the client will close when you finish/error
      await client.close();
    }
  }
  run().catch(console.dir);
});
