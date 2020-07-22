const knex = require('knex');
const app = require('../src/app');
const { makeNotesArray } = require('./notes.fixtures');
const { makeFoldersArray } = require('./folding.fixtures');
const { API_TOKEN } = require('../src/config');
const { agent } = require('supertest');
const supertest = require('supertest');


describe.only('folder Endpoints', () => {
    let db ;
  
    before('make knex instance', () => {
      db = knex({
        client : 'pg',
        connection : process.env.TEST_DB_URL,
      });
      app.set('db',db);
    });
    after('disconnect from db', () => db.destroy());
  
    before('clean the table', () => db.raw('TRUNCATE noteful_folders, noteful_notes RESTART IDENTITY CASCADE'));
  
    afterEach('cleanup', () => db.raw('TRUNCATE noteful_folders, noteful_notes RESTART IDENTITY CASCADE'));
    describe('GET /folders', () => {
      context('Given no folders', () => {
        it('responds with 200 and an empty array', () =>{
          return supertest(app)
          .get('/api/folders')
          .set('Authorization', `Bearer ${API_TOKEN}`)
          .expect(200,[]);
        });
      });
      context('Given there are folders in the database', () => {

        const testFolders = makeFoldersArray();
  
        beforeEach('insert notes', () => {
          return db
            .into('noteful_folders')
            .insert(testFolders)
        })
  
        it('responds with 200 and all of the notes', () => {
          return supertest(app)
            .get('/api/folders')
            .set('Authorization', `Bearer ${API_TOKEN}`)
            .expect(200, testFolders);
        });
      });
    });
  
    describe('GET /folders/:folders', () => {
      
      context('Given an invalid Id ', () => {

        it('should return 404, and an error json message', ()=>{
          const oofId = 123456;
          return supertest(app)
            .get(`/api/folders/${oofId}`)
            .set('Authorization', `Bearer ${API_TOKEN}`)
            .expect(404, {error : {message : 'that Folder doesn\'t exist... just like my waifu'}});
        });
      });
  
      context('Given there are notes in the database', () => {
        const testFolders = makeFoldersArray();
  
        beforeEach('insert notes', () => {
          return db
            .into('noteful_folders')
            .insert(testFolders)
        })
  
        it('responds with 200 and the specified note', () => {
          const folderId = 2;
          const expectedFolder = testFolders[folderId - 1];
          return supertest(app)
            .get(`/api/folders/${folderId}`)
            .set('Authorization', `Bearer ${API_TOKEN}`)
            .expect(200, expectedFolder);
        });
      });
    });
    describe('POST /folders', () => {
      
      
        
        it('should create an note, and responding with a 201 and the new note ', () =>{
            
            beforeEach('insert folders', () => {
              const testFolders = makeFoldersArray();
              return db
                .into('noteful_folders')
                .insert(testFolders)
            })

        const newTestFolder = {
          folder_name : 'Test',
        };

        const agent = supertest.agent(app)
        return agent
          .post('/api/folders')
          .set('Authorization', `Bearer ${API_TOKEN}`)
          .send(newTestFolder)
          .expect(201)
          .expect(res => {
            expect(res.body.folder_name).to.eql(newTestFolder.folder_name);
            expect(res.body).to.have.property('id');
            expect(res.headers.location).to.eql(`/api/folders/${res.body.id}`);
            const expected = new Date().toLocaleString();
            const actual = new Date(res.body.date_created).toLocaleString();
            expect(actual).to.eql(expected);
          })
          .then(postRes =>{
            return agent
              .set('Authorization', `Bearer ${API_TOKEN}`)
              .get(`/api/folders/${postRes.body.id}`)
              .expect(postRes.body);
          } 
          
          );
      });
  
      context('if given a bad json it should.. ', () => {
        const requestFields = [ 'folder_name'];
        requestFields.forEach( f => {
          const newOofTestItem = {
            folder_name: ' oof Test'
          };
          it(`responds with 400 and an error message when the ${f} is missing `, () => {
            delete newOofTestItem[f];
    
            return supertest(app)
              .post('/api/folders')
              .set('Authorization', `Bearer ${API_TOKEN}`)
              .send(newOofTestItem)
              .expect(400 , {
                error: {
                  message : `Missing '${f}' in request body`
                }
              });
    
    
          });
        } );
      });
  
    });
  
    describe('DELETE /folders/:folders_id', ()=> {
      const agent = supertest.agent(app)
    
      context('Given there are folder in the database', ()=>{
        const testFolders = makeFoldersArray();
  
        it('should responds with 204 and removes the target', () => {
            beforeEach('insert notes', () => {
              return db
                .into('noteful_folders')
                .insert(testFolders)
            })
            const idToRemove = 2;
          const expectedFolders = testFolders.filter(folder => folder.id !== idToRemove);
  
          return agent
            .delete(`/api/folders/${idToRemove}`)
            .set('Authorization', `Bearer ${API_TOKEN}`)
            .expect(204)
            .then(res => 
              agent
                .get('/api/folders')
                .set('Authorization', `Bearer ${API_TOKEN}`)
                .expect(expectedFolders)
            );
        });
  
      });
  
      context('if given a bad/:id', ()=>{
  
        it('should respond with 404', ()=> {
          const folderId = 123456;
          return agent
            .delete(`/api/folders/${folderId}`)
            .set('Authorization', `Bearer ${API_TOKEN}`)
            .expect(404, {error : {message : 'that Folder doesn\'t exist... just like my waifu'}});
        });
      });
    });
  
    describe('PATCH /api/folders/:folder_Id', ()=> {
        const testFolders = makeFoldersArray();
  
        beforeEach('insert folders', () => {
          return db
            .into('noteful_folders')
            .insert(testFolders)
        })
      context('Given no folders', () =>{
        it('responds with 404', ()=>{
          const note_id = 123456;
          return supertest(app)
            .patch(`/api/folders/${note_id}`)
            .set('Authorization', `Bearer ${API_TOKEN}`)
            .expect(404 , {error : {message : 'that Folder doesn\'t exist... just like my waifu' }});
        });
      });
      context('Given there are folders in the database', () =>{
        
  
        it('it should respond with 204 and updates the note', ()=>{
          const idToUpdate = 2;
          const updateNote = {
            note_name : 'updated title',
            folder_id : 3 ,
            content : 'updated content'
          };
          const expectedNote = {
            ...testFolders[idToUpdate - 1],
            ...updateNote
          }
  
          return supertest(app)
            .patch(`/api/folders/${idToUpdate}`)
            .set('Authorization', `Bearer ${API_TOKEN}`)
            .send(updateNote)
            .expect(204)
            .then( res =>
              supertest(app)
              .get(`/api/folders/${idToUpdate}`)
              .set('Authorization', `Bearer ${API_TOKEN}`)
              .expect(expectedNote)
              )
        });
        it('responds with a 400 when no required fields supplied', () =>{
          const idToUpdate = 2;
          return supertest(app)
          .patch(`/api/folders/${idToUpdate}`)
          .set('Authorization', `Bearer ${API_TOKEN}`)
          .send({ irrelevantField : 'foo'})
          .expect(400, {
            error : { message : "request body must contain at less the folder name "}
          })
        })

        it('responds with 204 when updating only a subset of field', () => {
          const idToUpdate = 2 
          const updateFolder = {
            folder_name : 'updated folder name (good enough)'
          }
          const expectedNote = {
            ...testFolders[idToUpdate - 1],
            ...updateFolder
          }
          return supertest(app)
          .patch(`/api/folders/${idToUpdate}`)
          .set('Authorization', `Bearer ${API_TOKEN}`)
          .send({
            ...updateFolder,
            fieldToIgnore : 'should not be in GET response'
          })
          .expect(204)
          .then(res => 
            supertest(app)
            .get(`/api/folders/${idToUpdate}`)
            .set('Authorization', `Bearer ${API_TOKEN}`)
            .expect(expectedNote)
            )
        })
      });
    });
  
  })