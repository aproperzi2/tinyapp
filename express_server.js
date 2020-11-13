const express = require('express');
const app = express();
const PORT = 8080;
const cookieSession = require('cookie-session');
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');
const helpers = require('./helpers');

app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2', 'key3']
}));

function generateRandomString() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return result;
}

// url database
const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "aJ48lW"
  },
  
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "aJ48lW"
  }
};

// users database
const users = {
  01: {
    id: "01", 
    email: "user1@example.com", 
    password: "1234", 
  },
 02: {
    id: "02", 
    email: "user2@example.com", 
    password: "5678",
  }
}


// RENDER ========================================================================== RENDER


// render actual website 
app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

// render json
app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

// render all urls page as home page
app.get('/', (req, res) => {
  const templateVars = { user_email: req.session.user_id, user_id: req.session.user_id, urls: urlDatabase };

  const user_id = req.session['user_id'];

  res.render('urls_index', templateVars);
});

// render all urls page 
app.get('/urls', (req, res) => {
  const templateVars = { user_email: req.session.user_email, user_id: req.session.user_id, urls: urlDatabase };

  res.render('urls_index', templateVars);
});

// render new url submission page
app.get('/urls/new', (req, res) => {
  const templateVars = { user_email: req.session.user_email, user_id: req.session.user_id, urls: urlDatabase};

  const user_id = req.session.user_id;
  
  if (!user_id) {
    return res.status(403).send('Error: Please register/sign in to TinyApp to start creating URLs.');
  }

  res.render('urls_new', templateVars);
});

// render single url 
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { user_email: req.session.user_email, user_id: req.session.user_id, shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL };

  res.render("urls_show", templateVars);
});

// render register page
app.get('/register', (req, res) => {
  const templateVars = { user_email: req.session.user_email, user_id: req.session.user_id, urls: urlDatabase };
  res.render('register', templateVars);
});

// render login page
app.get('/login', (req, res) => {
  const templateVars = { user_email: req.session.user_email, user_id: req.session.user_id, urls: urlDatabase };
  res.render('login', templateVars);
});


// POST =============================================================================== POST


// post new url
app.post("/urls/new", (req, res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = {longURL: req.body.longURL, userID: req.session.user_id};
  res.redirect(`/urls/${shortURL}`);  
});

// post register
app.post('/register', (req, res) => {
  const id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;

  if (email.length === 0 || password.length === 0) {
    return res.status(400).send('You need to re-enter a valid email and password.');
  }

  if (helpers.getUserByEmail(email, users)) {
    return res.status(400).send('Error: This email already exists in our database.');
  }
 
  
  const hashedPassword = bcrypt.hashSync(password, 10);

  const user = { id, email, password: hashedPassword };

  users[id] = user;
  req.session.user_id = users[id].id;
  req.session.user_email = users[id].email;
  req.session.user_password = users[id].hashedPassword;
  res.redirect('/urls');
});

// post login
app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  let user_id;
  let user_email;
  let hashedPassword;
  const user = helpers.getUserByEmail(email, users);

  hashedPassword = users[user].password;

  if (user && bcrypt.compareSync(password, hashedPassword)) {
    user_id = users[user].id;
    user_email = users[user].email;
  };
 
  if (user_id === undefined) {
    return res.status(403).send('Your login information is not valid.')
  };

  req.session.user_id = user_id;
  req.session.user_email = user_email;
  req.session.password = hashedPassword;
  res.redirect('/urls');
});

// post delete
app.post('/urls/:shortURL/delete', (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect('/urls');
});

// post update
app.post('/urls/:shortURL/update', (req, res) => {
  urlDatabase[req.params.shortURL].longURL = req.body.longURL;
  res.redirect('/urls');
});

// post logout
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});



// Listening on PORT 8080
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});