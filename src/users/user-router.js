const express = require('express');
const path = require('path');
const userRouter = express.Router();
const UserService = require('./user-service');
const xss = require('xss');

const serializeUser = user => ({
  id: user.id,
  fullname : user.fullname,
  username : xss(user.username),
  password : xss(user.password),
  nickname : xss(user.nickname),
  date_created : user.date_created , 
});


userRouter
  .route('/')
  .get((req,res,next) => {
    const knexInstance = req.app.get('db');
    UserService.getAllUsers(knexInstance)
      .then(nUser => {
        res.json(nUser.map(serializeUser));
      })
      .catch(next);
  })
  .post( express.json() , (req, res, next) => {
    const { fullname, username, password, nickname } = req.body; 
    const newUser = { fullname, username,};

    for(const [key,value] of Object.entries(newUser)){
      // eslint-disable-next-line eqeqeq
      if (!value) {
        return res.status(400).json({
          error : {
            message : `Missing '${key}' in request body`
          }
        });
      }
    }

    newUser.nickname = nickname ;
    newUser.password = password ;

    UserService.insertUser(req.app.get('db'), newUser)
      .then(user => {
        res
          .status(201)
          .location( path.posix.join(req.originalUrl + `/${user.id}`))
          .json(serializeUser(user));
      })
      .catch(next);
  });


userRouter
  .route('/:user_id')
  .all((req, res, next) => {
    UserService.getUserById(
      req.app.get('db'),
      req.params.user_id
    )
      .then(user => {
        if(!user){
          return res.status(404).json({
            error : {message : 'User doesn\'t exist... just like my waifu'}
          });
        }
        res.user = user;// save the user for the next middleware
        next();
      })
      .catch(next);
  })
  .get((req,res,next) => {
    res.json(serializeUser(res.user));  
  })
  .patch( express.json() , (req,res,next) => {
    const { fullname, username, password, nickname } = req.body;
    const userToUpdate = { fullname, username, password, nickname }; 

    const numberOfValues = Object.values(userToUpdate).filter(Boolean).length;
    if(numberOfValues === 0){
      return res.status(400).json({
        error : {
          message : 'request body must contain at less \'title\',\'style\',\'content\' '
        }
      });
    }
    UserService.updateUser(
      req.app.get('db'),
      req.params.user_id,
      userToUpdate
    )
      .then(numRowAffected =>{
        return res.status(204).end();
      })
      .catch(next);

  })

  .delete((req,res,next) => {
    UserService.deleteUser(
      req.app.get('db'),
      req.params.user_id
    )
      .then(()=> {
        res.status(204).end();
      })
      .catch(next);
  });

module.exports = userRouter ; 