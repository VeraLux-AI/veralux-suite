const express = require('express');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const { requireLogin } = require('./middleware/auth');

const app = express();

// Middleware to parse POST form data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


// Session config
app.use(session({
  secret: 'veralux-secret-key', // change this in production
  resave: false,
  saveUninitialized: true
}));

// Serve public static files
app.use(express.static(path.join(__dirname, 'public')));

// Public homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Login routes
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/login.html'));
});

app.post('/login', (req, res) => {
  const password = req.body.password;
  if (password === process.env.ADMIN_PASSWORD) {
    req.session.loggedIn = true;
    res.redirect('/admin');
  } else {
    res.send('<p>Incorrect password. <a href="/login">Try again</a></p>');
  }
});
const adminRoutes = require('./admin/admin.routes');
app.use('/admin', adminRoutes);

// 🔐 Protect /admin with middleware
app.use('/admin', requireLogin, express.static(path.join(__dirname, 'admin')));

// === API: Save Config for a Client ===
const fs = require('fs');

app.post('/api/configs/:clientId', (req, res) => {
  const clientId = req.params.clientId;
  const config = req.body;

  const configFolder = path.join(__dirname, 'configs');
  const filePath = path.join(configFolder, `${clientId}-config.js`);

  // Ensure configs folder exists
  if (!fs.existsSync(configFolder)) {
    fs.mkdirSync(configFolder);
  }

  const jsModule = `module.exports = ${JSON.stringify(config, null, 2)};\n`;

  fs.writeFile(filePath, jsModule, (err) => {
    if (err) {
      console.error("❌ Failed to save config:", err);
      return res.status(500).send("Error saving config.");
    }
    console.log(`✅ Saved config for ${clientId}`);
    res.status(200).send("Config saved.");
  });
});


// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ VeraLux Suite running at http://localhost:${PORT}`);
});
