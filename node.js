const express = require('express');
const path = require('path');
const app = express();
const port = 8000;

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Route for the login page
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Route for the dashboard page
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Catch-all route to redirect to login for any other paths
app.get('*', (req, res) => {
    res.redirect('/login');
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});