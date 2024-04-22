const { MongoClient } = require("mongodb");
const express = require('express');
const cookieParser = require('cookie-parser');
const ObjectId = require('mongodb').ObjectId;
const session = require('express-session');
const Database = require('./dataContext');

const app = express();
const port = 3000;

const database = new Database(); //This is for the singleton pattern implementation

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

// Route to handle adding comments
app.post('/comments', async function(req, res) {
  try {
    const { topicID, commentContent } = req.body;
    
    // Check if the topicID and commentContent are provided
    if (!topicID || !commentContent) {
      return res.status(400).send('Missing required fields');
    }

    // Generate a unique comment ID
    const commentID = new ObjectId();

    // Add the comment to the database with unique comment ID
    await database.connect();
    const collection = database.getCollection('crlmdb', 'comments');
    await collection.insertOne({
      commentID,
      topicID,
      commentContent,
      userID: req.session.userID, // Add the userID from the session
      dateTime: new Date().toISOString()
    });

    // Send a success response
    res.status(201).send('Comment added successfully');
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).send('Error adding comment');
  } finally {
    await database.close();
  }
});

// Route to handle retrieving comments for a specific topic
app.get('/comments', async function(req, res) {
  try {
    const { topicID } = req.query;

    // Check if the topicID is provided
    if (!topicID) {
      return res.status(400).send('Missing required parameter: topicID');
    }

    // Retrieve comments for the specified topicID
    await database.connect();
    const collection = database.getCollection('crlmdb', 'comments');
    const comments = await collection.find({ topicID }).toArray();

    // Construct the response HTML with comments, userID, and dateTime
    let responseHTML = '<h2>Comments:</h2>';
    comments.forEach(comment => {
      responseHTML += `<div><strong>Topic:</strong> ${comment.topicID}<br>`;
      responseHTML += `<div><strong>User:</strong> ${comment.userID}<br>`;
      responseHTML += `<strong>Date:</strong> ${new Date(comment.dateTime).toLocaleString()}<br>`;
      responseHTML += `<strong>Comment:</strong> ${comment.commentContent}</div><br>`;
    });

    // Send the response HTML
    res.status(200).send(responseHTML);
  } catch (error) {
    console.error("Error retrieving comments:", error);
    res.status(500).send('Error retrieving comments');
  } finally {
    await database.close();
  }
});

// Route to handle retrieving the two most recent comments from the database
app.get('/recentcomments', async function(req, res) {
  try {
    // Connect to the database
    await database.connect();
    
    // Get the comments collection
    const collection = database.getCollection('crlmdb', 'comments');
    
    // Find the two most recent comments
    const comments = await collection.find()
    .sort({ _id: -1 }) // Sort by _id in descending order (assuming it's an ObjectId)
    .limit(2) // Limit to two comments
    .toArray();

    // Send the comments as JSON response
    res.status(200).json(comments);
  } catch (error) {
    console.error("Error retrieving recent comments:", error);
    res.status(500).send('Error retrieving recent comments');
  } finally {
    // Close the database connection
    await database.close();
  }
});

// Route to create a new topic
app.post('/topics', async function(req, res) {
  try {
    const { title } = req.body;
    const userID = req.session.userID;
    await database.connect();
    const collection = database.getCollection('crlmdb', 'topics');
    await collection.insertOne({ 
      title,
      createdBy: req.session.userID,
      subscribedUsers: [userID]
     });
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

// Route to handle retrieving subscribed topics for the current user
app.get('/subscribedtopics', async function(req, res) {
  try {
    const userID = req.session.userID;

    if (!userID) {
      return res.status(401).send('Unauthorized');
    }

    await database.connect();
    const collection = database.getCollection('crlmdb', 'topics');
    const subscribedTopics = await collection.find({ subscribedUsers: userID }).toArray();
    res.status(200).json(subscribedTopics);
  } catch (error) {
    console.error("Error getting subscribed topics:", error);
    res.status(500).send('Error getting subscribed topics');
  } finally {
    await database.close();
  }
});

// Route to handle subscribing to a topic
app.post('/subscribe', async function(req, res) {
  try {
    const { topicID } = req.body;
    const userID = req.session.userID;

    await database.connect();
    const collection = database.getCollection('crlmdb', 'topics');
    const result = await collection.updateOne(
      { _id: new ObjectId(topicID) }, // Use ObjectId directly
      { $addToSet: { subscribedUsers: userID } }
    );

    if (result.modifiedCount > 0) {
      res.status(200).send('Subscribed to the topic successfully');
    } else {
      res.status(404).send('Topic not found');
    }
  } catch (error) {
    console.error("Error subscribing to topic:", error);
    res.status(500).send('Error subscribing to topic');
  } finally {
    await database.close();
  }
});

// Route to handle unsubscribing from a topic
app.post('/unsubscribe', async function(req, res) {
  try {
    const { topicID } = req.body;
    const userID = req.session.userID;

    await database.connect();
    const collection = database.getCollection('crlmdb', 'topics');
    const result = await collection.updateOne(
      { _id: new ObjectId(topicID) }, // Use ObjectId directly
      { $pull: { subscribedUsers: userID } } // Use $pull to remove user from array
    );

    if (result.modifiedCount > 0) {
      res.status(200).send('Unsubscribed from the topic successfully');
    } else {
      res.status(404).send('Topic not found');
    }
  } catch (error) {
    console.error("Error unsubscribing from topic:", error);
    res.status(500).send('Error unsubscribing from topic');
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
