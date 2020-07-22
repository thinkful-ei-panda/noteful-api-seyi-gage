const express = require('express');
const path = require('path');
const foldersRouter = express.Router();
const FoldersService = require('./folders-service');
const xss = require('xss');
const logger = require('../e-logger');

const serializeFolder = folder => ({
  id: folder.id,
  folder_name : xss(folder.folder_name),
  date_created : folder.date_created
});


foldersRouter
  .route('/')
  .get((req,res,next) => {
    const knexInstance = req.app.get('db');
    FoldersService.getAllFolders(knexInstance)
      .then(mFolder => {
        res.json(mFolder.map(serializeFolder));
      })
      .catch(next);
  })
  .post( express.json() , (req, res, next) => {
    const {folder_name , date_created } = req.body; 

    const newFolder = {folder_name};
  
    if (!folder_name){
      logger.error('throw error because the body was missing folder_name');
      return res.status(400).json({
        error : {
          message : 'Missing \'folder_name\' in request body'
        }
      });
    }

    newFolder.date_created = date_created;
    console.log('###',req.body);

    FoldersService.insertFolder(req.app.get('db'), newFolder)
      .then(folder => {
        res
          .status(201)
          .location( path.posix.join(req.originalUrl + `/${folder.id}`))
          .json(serializeFolder(folder));
      })
      .catch(next);
  });


foldersRouter
  .route('/:folder_id')
  .all((req, res, next) => {
    FoldersService.getFoldersById(
      req.app.get('db'),
      req.params.folder_id
    )
      .then(folder => {
        if(!folder){
          logger.error('something went wrong since the endpoint didn\'t exist');
          return res.status(404).json({
            error : {message : 'that Folder doesn\'t exist... just like my waifu'}
          });
        }
        res.folder = folder;
        next();
      })
      .catch(next);
  })
  .get((req,res,next) => {
    res.json(serializeFolder(res.folder));  
  })
  .patch( express.json() , (req,res,next) => {
    const { foldername } = req.body;
    const folderToUpdate = { foldername }; 

    const numberOfValues = Object.values(folderToUpdate).filter(Boolean).length;
    if(numberOfValues === 0){
      logger.error('error happend since the field wasn\'t filled out all the way and was missing something....');
      return res.status(400).json({
        error : {
          message : 'request body must contain at less the folder name '
        }
      });
    }

    FoldersService.updateFolders(
      req.app.get('db'),
      req.params.folder_id,
      folderToUpdate
    )
      .then(numRowAffected =>{
        return res.status(204).end();
      })
      .catch(next);

  })

  .delete((req,res,next) => {
    FoldersService.deleteFolders(
      req.app.get('db'),
      req.params.folder_id
    )
      .then(()=> {
        res.status(204).end();
      })
      .catch(next);
  });

module.exports = foldersRouter ; 