const express = require('express');
const path = require('path');
const notesRouter = express.Router();
const NotesService = require('./notes-service');
const xss = require('xss');
const logger = require('../e-logger');


const serializeNotes = note => ({
  id: note.id,
  note_name : xss(note.note_name),
  date_created : note.date_created,
  content : xss(note.content),
  folder_id : Number(xss(note.folder_id)) 
});


notesRouter
  .route('/')
  .get((req,res,next) => {
    const knexInstance = req.app.get('db');
    NotesService.getAllNotes(knexInstance)
      .then(nNotes => {
        res.json(nNotes.map(serializeNotes));
      })
      .catch(next);
  })
  .post( express.json() , (req, res, next) => {
    const {note_name, content, folder_id} = req.body; 
    const newNote = {note_name, content, folder_id};

    for(const [key,value] of Object.entries(newNote)){
      // eslint-disable-next-line eqeqeq
      if (!value) {
        logger.error(`throw error because ${key} was missing`);
        return res.status(400).json({
          error : {
            message : `Missing '${key}' in request body`
          }
        });
      }
    }

  

    NotesService.insertNotes(req.app.get('db'), newNote)
      .then(note => {
        res
          .status(201)
          .location( path.posix.join(req.originalUrl + `/${note.id}`))
          .json(serializeNotes(note));
      })
      .catch(next);
  });


notesRouter
  .route('/:note_id')
  .all((req, res, next) => {
    NotesService.getNotesById(
      req.app.get('db'),
      req.params.note_id
    )
      .then(note => {
        if(!note){
          logger.error('the endpoint that was trying to be called didn\'t exist');
          return res.status(404).json({
            error : {message : 'note doesn\'t exist... just like my waifu'}
          });
        }
        res.note = note;// save the note for the next middleware
        next();
      })
      .catch(next);
  })
  .get((req,res,next) => {
    res.json(serializeNotes(res.note));  
  })
  .patch( express.json() , (req,res,next) => {
    console.log('req.body @ l80',req.body);
    const { note_name, folder_id,  content} = req.body;
    const noteToUpdate = { note_name, folder_id, content }; 

    const numberOfValues = Object.values(noteToUpdate).filter(Boolean).length;
    if(numberOfValues === 0){
      logger.error('one of the required fields was missing ');
      return res.status(400).json({
        error : {
          message : 'request body must contain at less \'note_name\',\'folder_id\',\'content\' '
        }
      });
    }
    NotesService.updateNote(
      req.app.get('db'),
      req.params.note_id,
      noteToUpdate
    )
      .then(numRowAffected =>{
        return res.status(204).end();
      })
      .catch(next);

  })

  .delete((req,res,next) => {
    NotesService.deleteNote(
      req.app.get('db'),
      req.params.note_id
    )
      .then(()=> {
        res.status(204).end();
      })
      .catch(next);
  });

module.exports = notesRouter ; 