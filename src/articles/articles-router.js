const express = require('express');
const path = require('path');
const articleRouter = express.Router();
const ArticlesService = require('./articles-service');
const xss = require('xss');

const serializeArticle = article => ({
  id: article.id,
  style : article.style,
  title : xss(article.title),
  content : xss(article.content),
  date_published : article.date_published , 
});


articleRouter
  .route('/')
  .get((req,res,next) => {
    const knexInstance = req.app.get('db');
    ArticlesService.getAllArticles(knexInstance)
      .then(art => {
        res.json(art.map(serializeArticle));
      })
      .catch(next);
  })
  .post( express.json() , (req, res, next) => {
    const {title , content, style } = req.body; 
    const newArticle = {title , content , style};

    for(const [key,value] of Object.entries(newArticle)){
      // eslint-disable-next-line eqeqeq
      if (!value) {
        return res.status(400).json({
          error : {
            message : `Missing '${key}' in request body`
          }
        });
      }
    }

    ArticlesService.insertArticle(req.app.get('db'), newArticle)
      .then(article => {
        res
          .status(201)
          .location( path.posix.join(req.originalUrl + `/${article.id}`))
          .json(serializeArticle(article));
      })
      .catch(next);
  });


articleRouter
  .route('/:article_id')
  .all((req, res, next) => {
    ArticlesService.getById(
      req.app.get('db'),
      req.params.article_id
    )
      .then(article => {
        if(!article){
          return res.status(404).json({
            error : {message : 'Article doesn\'t exist... just like my waifu'}
          });
        }
        res.article = article;// save the art for the next middleware
        next();
      })
      .catch(next);
  })
  .get((req,res,next) => {
    res.json(serializeArticle(res.article));  
  })
  .patch( express.json() , (req,res,next) => {
    const {title, style , content} = req.body;
    const articleToUpdate = {title, style, content}; 

    const numberOfValues = Object.values(articleToUpdate).filter(Boolean).length;
    if(numberOfValues === 0){
      return res.status(400).json({
        error : {
          message : 'request body must contain at less \'title\',\'style\',\'content\' '
        }
      });
    }
    ArticlesService.updateArticle(
      req.app.get('db'),
      req.params.article_id,
      articleToUpdate
    )
      .then(numRowAffected =>{
        return res.status(204).end();
      })
      .catch(next);

  })

  .delete((req,res,next) => {
    ArticlesService.deleteArticle(
      req.app.get('db'),
      req.params.article_id
    )
      .then(()=> {
        res.status(204).end();
      })
      .catch(next);
  });

module.exports = articleRouter ; 