const express = require('express');
const app = express();
const PORT = 8080;
const cookieParser = require('cookie-parser');
const bodyParser = require("body-parser");

app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');

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
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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

// render actual website 
app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

// render json
app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

// render all urls page
app.get('/urls', (req, res) => {
  const templateVars = { user_email: req.cookies['user_email'], user_id: req.cookies['user_id'], urls: urlDatabase };
  res.render('urls_index', templateVars);
});

// render new url submission page
app.get('/urls/new', (req, res) => {
  const templateVars = { user_email: req.cookies['user_email'], user_id: req.cookies['user_id'], urls: urlDatabase };

  const user_id = req.cookies['user_id'];
  
  if (!user_id) {
    res.redirect('/login');
  }

  res.render('urls_new', templateVars);
});

// render single url 
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { user_email: req.cookies['user_email'], user_id: req.cookies['user_id'], shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render("urls_show", templateVars);
});

// render register page
app.get('/register', (req, res) => {
  const templateVars = { user_email: req.cookies['user_email'], user_id: req.cookies['user_id'], urls: urlDatabase };
  res.render('register', templateVars);
});

// render login page
app.get('/login', (req, res) => {
  const templateVars = { user_email: req.cookies['user_email'], user_id: req.cookies['user_id'], urls: urlDatabase };
  res.render('login', templateVars);
});





// post new url
app.post("/urls/new", (req, res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
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

  for (let user in users) {
    if (users[user].email === email) {
      return res.status(400).send('This email already exists.');
    }
  }

  const user = { id, email, password };

  users[id] = user;
  res.cookie('user_id', users[id].id)
  res.redirect('/urls');
});

// post login
app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  let user_id;
  let user_email;

  for (let user in users) {
    if (users[user].email === email && users[user].password === password) {
      user_id = users[user].id;
      user_email = users[user].email;
    }
  }

  if (user_id === undefined) {
    return res.status(403).send('Your login information is not valid.')
  }
  
  

  res.cookie('user_id', user_id);
  res.cookie('user_email', user_email);
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
  urlDatabase[req.params.shortURL] = req.body.longURL;
  res.redirect('/urls');
});

// post logout
app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.clearCookie('user_email');
  res.redirect('/urls');
});












// Listening on PORT 8080
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});