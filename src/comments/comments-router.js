const express = require('express');
const path = require('path');
const commentRouter = express.Router();
const commentService = require('./comments-service');
const xss = require('xss');

const serializeComment = comment => ({
  id: comment.id,
  text : xss(comment.text),
  date_commented : comment.date_commented,
  article_id : comment.article_id,
  user_id : comment.user_id, 
  comment_id : comment.comment_id
});


commentRouter
  .route('/')
  .get((req,res,next) => {
    const knexInstance = req.app.get('db');
    commentService.getAllComments(knexInstance)
      .then(nComment => {
        res.json(nComment.map(serializeComment));
      })
      .catch(next);
  })
  .post( express.json() , (req, res, next) => {
    const {text, article_id, user_id , date_commented } = req.body; 
    const newComment = {text , article_id , user_id};

    for(const [key,value] of Object.entries(newComment)){
      // eslint-disable-next-line eqeqeq
      if (!value) {
        return res.status(400).json({
          error : {
            message : `Missing '${key}' in request body`
          }
        });
      }
    }

    newComment.date_commented = date_commented ;

    commentService.insertComments(req.app.get('db'), newComment)
      .then(comment => {
        res
          .status(201)
          .location( path.posix.join(req.originalUrl + `/${comment.id}`))
          .json(serializeComment(comment));
      })
      .catch(next);
  });


commentRouter
  .route('/:comment_id')
  .all((req, res, next) => {
    commentService.getCommentsById(
      req.app.get('db'),
      req.params.comment_id
    )
      .then(comment => {
        if(!comment){
          return res.status(404).json({
            error : {message : 'comment doesn\'t exist... just like my waifu'}
          });
        }
        res.comment = comment;// save the comment for the next middleware
        next();
      })
      .catch(next);
  })
  .get((req,res,next) => {
    res.json(serializeComment(res.comment));  
  })
  .patch( express.json() , (req,res,next) => {
    const { text,  date_commented} = req.body;
    const commentToUpdate = { text, date_commented}; 

    const numberOfValues = Object.values(commentToUpdate).filter(Boolean).length;
    if(numberOfValues === 0){
      return res.status(400).json({
        error : {
          message : 'request body must contain at less \'title\',\'style\',\'content\' '
        }
      });
    }
    commentService.updateComment(
      req.app.get('db'),
      req.params.comment_id,
      commentToUpdate
    )
      .then(numRowAffected =>{
        return res.status(204).end();
      })
      .catch(next);

  })

  .delete((req,res,next) => {
    commentService.deleteComment(
      req.app.get('db'),
      req.params.comment_id
    )
      .then(()=> {
        res.status(204).end();
      })
      .catch(next);
  });

module.exports = commentRouter ; 