require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const { NODE_ENV, API_TOKEN } = require('./config');
const foldersRouter = require('./folders/folders-router');
const notesRouter = require('./notes/notes-router');
const logger = require('./e-logger');

const app = express();

const morganOption = (NODE_ENV === 'production')
  ? 'tiny'
  : 'common' ;

app.use(morgan(morganOption));
app.use(helmet());
app.use(cors());

/*api-key*/
// app.use( (req,res,next) =>{
//   const token = req.get('Authorization');
//   if(!token || token.split(' ')[1] !== API_TOKEN){
//     logger.error('missing API_TOKEN');
//     res.status(401).json({error:'that\'s not allowed'} );
//   }
//   next();
// });


app.use('/api/folders',foldersRouter);
app.use('/api/notes', notesRouter);

app.get( '/', (req,res) => {
//   throw new Error('Error makes computer fans go brrrr');
  res.status(200).send('hello i think you have the wrong endpoint, maybe try add in /api/notes to this');
});

// app.get('/xss',(req,res) => {
//   res.cookie('supersecretToken','6sfg8j4d6gf4h');
//   res.sendFile(__dirname + '/xss-example.html');
// });

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