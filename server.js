const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');
const { initDB, prepare } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  secret: 'codewave-secret-key-2026',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// Initialise the database (async – loads WASM)
let dbReady = initDB().catch((err) => {
  console.error('Failed to initialise database:', err);
});

// Ensure DB is ready before handling any request
app.use(async (req, res, next) => {
  await dbReady;
  next();
});

// Make user available in all templates
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// Auth middleware
function requireAuth(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  next();
}

// ── Pages ──

app.get('/', (req, res) => res.render('home', { page: 'home' }));
app.get('/about', (req, res) => res.render('about', { page: 'about' }));
app.get('/services', (req, res) => res.render('services', { page: 'services' }));
app.get('/contact', (req, res) => res.render('contact', { page: 'contact', success: null, error: null }));

// ── Auth ──

app.get('/signup', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.render('signup', { page: 'signup', error: null });
});

app.post('/signup', async (req, res) => {
  const { full_name, email, password, confirm_password } = req.body;

  if (!full_name || !email || !password || !confirm_password) {
    return res.render('signup', { page: 'signup', error: 'All fields are required.' });
  }
  if (password.length < 6) {
    return res.render('signup', { page: 'signup', error: 'Password must be at least 6 characters.' });
  }
  if (password !== confirm_password) {
    return res.render('signup', { page: 'signup', error: 'Passwords do not match.' });
  }

  const existing = prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.render('signup', { page: 'signup', error: 'Email already registered.' });
  }

  const hash = await bcrypt.hash(password, 10);
  prepare('INSERT INTO users (full_name, email, password) VALUES (?, ?, ?)').run(full_name, email, hash);

  res.redirect('/login');
});

app.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.render('login', { page: 'login', error: null });
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.render('login', { page: 'login', error: 'All fields are required.' });
  }

  const user = prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) {
    return res.render('login', { page: 'login', error: 'Invalid email or password.' });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.render('login', { page: 'login', error: 'Invalid email or password.' });
  }

  req.session.user = { id: user.id, full_name: user.full_name, email: user.email };
  res.redirect('/dashboard');
});

app.get('/dashboard', requireAuth, (req, res) => {
  const user = prepare('SELECT * FROM users WHERE id = ?').get(req.session.user.id);
  res.render('dashboard', { page: 'dashboard', profile: user });
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

// ── Contact Form ──

app.post('/contact', (req, res) => {
  const { name, email, phone, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.render('contact', { page: 'contact', success: null, error: 'Please fill in all required fields.' });
  }

  try {
    prepare('INSERT INTO contact_messages (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)')
      .run(name, email, phone || null, subject, message);
    res.render('contact', { page: 'contact', success: 'Your message has been sent successfully!', error: null });
  } catch (err) {
    res.render('contact', { page: 'contact', success: null, error: 'Something went wrong. Please try again.' });
  }
});

// Start listening only when running locally (not on Vercel)
if (!process.env.VERCEL) {
  dbReady.then(() => {
    app.listen(PORT, () => {
      console.log(`CodeWave Technologies server running at http://localhost:${PORT}`);
    });
  });
}

// Export the app for Vercel serverless
module.exports = app;
