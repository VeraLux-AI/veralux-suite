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

// === API: Save Config as .json ===
const fs = require('fs');

app.post('/api/configs/:clientId', (req, res) => {
  const clientId = req.params.clientId;
  const config = req.body;

  const configFolder = path.join(__dirname, 'configs');
  const filePath = path.join(configFolder, `${clientId}.json`);

  if (!fs.existsSync(configFolder)) {
    fs.mkdirSync(configFolder);
  }

  fs.writeFile(filePath, JSON.stringify(config, null, 2), (err) => {
    if (err) {
      console.error("❌ Failed to save config:", err);
      return res.status(500).send("Error saving config.");
    }
    console.log(`✅ Saved config for ${clientId}`);
    res.status(200).send("Config saved.");
  });
});

// === API: Read Config as .json ===
app.get('/api/configs/:clientId', requireLogin, (req, res) => {
  const clientId = req.params.clientId;
  const filePath = path.join(__dirname, 'configs', `${clientId}.json`);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Config not found." });
  }

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error("❌ Error reading config:", err);
      return res.status(500).json({ error: "Failed to read config." });
    }

    try {
      const config = JSON.parse(data);
      res.json(config);
    } catch (parseErr) {
      console.error("❌ Invalid JSON:", parseErr);
      return res.status(500).json({ error: "Invalid JSON format." });
    }
  });
});


// Start server
const port = parseInt(process.env.PORT, 10) || 10000;

app.listen(port, () => {
  console.log(`✅ VeraLux Suite running at http://localhost:${port}`);
});

