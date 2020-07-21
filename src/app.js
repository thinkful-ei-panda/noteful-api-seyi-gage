require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const { NODE_ENV } = require('./config');
const articlesRouter = require('./articles/articles-router');
const userRouter = require('./users/user-router');
const commentRouter = require('./comments/comments-router');

const app = express();

const morganOption = (NODE_ENV === 'production')
  ? 'tiny'
  : 'common' ;

app.use(morgan(morganOption));
app.use(helmet());
app.use(cors());

app.use('/api/articles',articlesRouter);
app.use('/api/users', userRouter);
app.use('/api/comment', commentRouter);

app.get( '/', (req,res) => {
//   throw new Error('Error makes computer fans go brrrr');
  res.status(200).send('OwO wi mwaking gwod pwa gwas!');
});

app.get('/xss',(req,res) => {
  res.cookie('supersecretToken','6sfg8j4d6gf4h');
  res.sendFile(__dirname + '/xss-example.html');
});

app.use(function errorHandler(error, req , res , next){/*eslint-disable-line*/
  let response;
  if ( NODE_ENV === 'production'){
    response = { error : {message : 'server error' } };
  }else{
    console.error(error);/*eslint-disable-line*/
    response = { message : error.message, error };
  }
  res.status(500).json(response).send();
});


module.exports = app;