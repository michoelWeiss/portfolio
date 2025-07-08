import createError from 'http-errors';
import express from 'express';
import path from 'path';
import http from 'http';
import { Server } from 'socket.io';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import chatters_auth from './routes/chatters_auth.js';
import chatsRouter, { setupChatSockets } from './routes/chats.js';
import session from 'express-session';
import sharedSession from 'express-socket.io-session';
import run_sqlPool from './pool.js';
import debugLib from 'debug';
const debug = debugLib('contacts:server');

var app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer);
const __dirname = import.meta.dirname;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const sessionMiddleware = session({
  secret: 'this_is_very_secure',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // make true for webpage
});

app.use(sessionMiddleware);
io.use(sharedSession(sessionMiddleware, {
  autoSave: true
}));
app.use((req, res, next) => {
  if (!req.pool) {
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
    display_message: 'Welcome to the home page loremloram100ddddddddddddddddddddddddd ddddddddddddddddddddddddddddddddd ddddddddddddddddddddddddddddd dddddddddddddddddddd ddddddddddddd ddddddd dddddddddddddddddddddddd ddddddddddddddddddddddddddddddd ddddddddddddddddddddddddddddddddd dddddddddddddddddddddddddd',
    Sign_InButt: true,
    Sign_UpButt: true,
    partials: {
      content: 'displayMessage_nav'
    }
  });
});

app.use('/Chatters/auth', chatters_auth);
app.use('/Chatters/chats', chatsRouter);

setupChatSockets(io);
const PORT = process.env.PORT || '80';
httpServer.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});


httpServer.on('error', onError);
httpServer.on('listening', onListening);

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

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}
function onListening() {
  var addr = httpServer.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}
export default app; 
