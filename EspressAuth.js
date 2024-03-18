const express = require('express');
const cookieParser = require('cookie-parser');
const { MongoClient } = require('mongodb');

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// MongoDB connection
const uri = "mongodb+srv://ExpressAccount:JvmdZ7svEXsLGfBn@cluster0.xheynkp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
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

    // Default endpoint
    app.get('/', (req, res) => {
        if (req.cookies.auth) {
            res.send(`Authentication cookie exists. Value: ${req.cookies.auth}`);
        } else {
            res.send(`
                <h1>Login or Register</h1>
                <a href="/login">Login</a> | <a href="/register">Register</a>
            `);
        }
    });

    // Register endpoint
    app.get('/register', (req, res) => {
        res.send(`
            <h1>Register</h1>
            <form action="/register" method="post">
                <input type="text" name="user_ID" placeholder="User ID" required>
                <input type="password" name="password" placeholder="Password" required>
                <button type="submit">Register</button>
            </form>
        `);
    });

    app.post('/register', async (req, res) => {
        const { user_ID, password } = req.body;
        await collection.insertOne({ user_ID, password });
        res.redirect('/');
    });

    // Login endpoint
    app.get('/login', (req, res) => {
        res.send(`
            <h1>Login</h1>
            <form action="/login" method="post">
                <input type="text" name="user_ID" placeholder="User ID" required>
                <input type="password" name="password" placeholder="Password" required>
                <button type="submit">Login</button>
            </form>
        `);
    });

    app.post('/login', async (req, res) => {
        const { user_ID, password } = req.body;
        const user = await collection.findOne({ user_ID, password });
        if (user) {
            res.cookie('auth', 'authenticated', { maxAge: 60000 });
            res.redirect('/');
        } else {
            res.send('Invalid user ID or password. <a href="/">Return to home</a>');
        }
    });

    // Endpoint to show all active cookies
    app.get('/showcookies', (req, res) => {
        res.send(req.cookies);
    });

    // Endpoint to clear the authentication cookie
    app.get('/clearcookie', (req, res) => {
        res.clearCookie('auth');
        res.send('Authentication cookie cleared. <a href="/">Return to home</a>');
    });

    // Start the server
    app.listen(port, () => {
        console.log(`Server started at http://localhost:${port}`);
    });
});
