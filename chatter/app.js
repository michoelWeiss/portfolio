import createError from 'http-errors';
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import chatters_auth from './routes/chatters_auth.js';
import chatsRouter from './routes/chats.js';
import session from 'express-session';
import run_sqlPool from './pool.js';


var app = express();
const __dirname = import.meta.dirname;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'this_is_very_secure',
  resave: false,
  saveUninitialized: false
}));

app.use((req, res, next)=>{
  if(!req.pool){
    req.pool = run_sqlPool();
  }
  next();
});
app.get('/', (req, res, next) => {
  res.sendFile(path.join(__dirname, 'public', 'html/index.html'));
});
app.use('/Asteroid', (req, res, next) => {
  res.sendFile(path.join(__dirname, 'public', 'html/asteroid.html'));
});
app.use('/Bubbles', (req, res, next) => {
  res.sendFile(path.join(__dirname, 'public', 'html/bubbles.html'));
});

app.get('/Chatters', (req, res, next) => {
  res.render('layout', {
    title: 'Home',
    display_backLink: false,
    partials: {
      content: 'home_chatting'
    }
  });
});

app.use('/Chatters/auth', chatters_auth);
app.use('/Chatters/chats', chatsRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('layout', {
    partials: {
      content: 'error'
    }
  });
});

export default app;
