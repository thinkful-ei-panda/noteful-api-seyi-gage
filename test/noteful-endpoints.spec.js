const knex = require('knex');
const app = require('../src/app');
const { makeNotesArray } = require('./notes.fixtures');
const { makeFoldersArray } = require('./folding.fixtures');
const { API_TOKEN } = require('../src/config');


describe.only('notes Endpoints', () => {

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

  describe('GET /notes', () => {
    context('Given no notes', () => {
      it('responds with 200 and an empty array', () =>{
        return supertest(app)
        .get('/api/notes')
        .set('Authorization', `Bearer ${API_TOKEN}`)
        .expect(200,[]);
      });
    });
    context('Given there are notes in the database', () => {
      const testNotes = makeNotesArray();
      const testFolders = makeFoldersArray();

      beforeEach('insert notes', () => {
        return db
          .into('noteful_folders')
          .insert(testFolders)
          .then(() => {
            return db
              .into('noteful_notes')
              .insert(testNotes)
          })
      })

      it('responds with 200 and all of the notes', () => {
        return supertest(app)
          .get('/api/notes')
          .set('Authorization', `Bearer ${API_TOKEN}`)
          .expect(200, testNotes);
      });
    });
  });

  describe('GET /notes/:note_id', () => {
    context('Given an XSS attack note', () => {
      const testFolders = makeFoldersArray();
      const maliciousNote = {
        id : 911,
        note_name : 'Naughty naughty very naughty <script>alert("xss");</script>',
        folder_id: 1 ,
        content: 'Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.'
      };

      beforeEach('insert notes', () => {
        return db
          .into('noteful_folders')
          .insert(testFolders)
          .then(() => {
            return db
              .into('noteful_notes')
              .insert([maliciousNote])
          });
      })

      it('removes XSS attack content', () => {
        return supertest(app)
          .get(`/api/notes/${maliciousNote.id}`)
          .set('Authorization', `Bearer ${API_TOKEN}`)
          .expect(200)
          .expect(res => {
            expect(res.body.note_name).to.eql('Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;');
            expect(res.body.content).to.eql('Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.');
          });
      });

    });

    context('Given an invalid Id ', () => {
      it('should return 404, and an error json message', ()=>{
        const oofId = 123456;
        return supertest(app)
          .get(`/api/notes/${oofId}`)
          .set('Authorization', `Bearer ${API_TOKEN}`)
          .expect(404, {error : {message : 'note doesn\'t exist... just like my waifu'}});
      });
    });

    context('Given there are notes in the database', () => {
      const testNotes = makeNotesArray();
      const testFolders = makeFoldersArray();

      beforeEach('insert notes', () => {
        return db
          .into('noteful_folders')
          .insert(testFolders)
          .then(() => {
            return db
              .into('noteful_notes')
              .insert(testNotes)
          })
      })

      it('responds with 200 and the specified note', () => {
        const noteId = 2;
        const expectedNote = testNotes[noteId - 1];
        return supertest(app)
          .get(`/api/notes/${noteId}`)
          .set('Authorization', `Bearer ${API_TOKEN}`)
          .expect(200, expectedNote);
      });
    });
  });
  describe('POST /notes', () => {

    it.only('should create an note, and responding with a 201 and the new note ', () =>{
      
      const newTestNote = {
        note_name : 'Test',
        folder_id : 2 ,
        content: 'Test new content'
      };

      const testFolder = {
        id: 2,
        date_created: '2029-02-22T16:28:32.615Z',
        folder_name: 'folder 2'
      }

      return supertest(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${API_TOKEN}`)
        .send(newTestNote)
        .expect(201)
        .expect(res => {
          expect(res.body.note_name).to.eql(newTestItem.note_name);
          expect(res.body.folder_id).to.eql(newTestItem.folder_id);
          expect(res.body.content).to.eql(newTestItem.content);
          expect(res.body).to.have.property('id');
          expect(res.headers.location).to.eql(`/api/notes/${res.body.id}`);
          const expected = new Date().toLocaleString();
          const actual = new Date(res.body.date_created).toLocaleString();
          expect(actual).to.eql(expected);
        })
        .then(postRes =>{
          return supertest(app)
            .set('Authorization', `Bearer ${API_TOKEN}`)
            .get(`/api/notes/${postRes.body.id}`)
            .expect(postRes.body);
        } 
        
        );
    });

    context('if given a bad json it should.. ', () => {
      const requestFields = [ 'note_name','folder_id','content'];
      requestFields.forEach( f => {
        const newOofTestItem = {
          note_name: ' oof Test',
          folder_id: 1 ,
          content: ' oof Test new content'
        };
        it(`responds with 400 and an error message when the ${f} is missing `, () => {
          delete newOofTestItem[f];
  
          return supertest(app)
            .post('/api/notes')
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

  describe('DELETE /notes/:notes_id', ()=> {
  
    context('Given there are notes in the database', ()=>{
      const testNotes = makeNotesArray();
      const testFolders = makeFoldersArray();

      beforeEach('insert notes', () => {
        return db
          .into('noteful_folders')
          .insert(testFolders)
          .then(() => {
            return db
              .into('noteful_notes')
              .insert(testNotes)
          })
      })
      it('should responds with 204 and removes the target', () => {
        const idToRemove = 2;
        const expectedNotes = testNotes.filter(note => note.id !== idToRemove);
        return supertest(app)
          .set('Authorization', `Bearer ${API_TOKEN}`)
          .delete(`/api/notes/${idToRemove}`)
          .expect(204)
          .then(res => 
            supertest(app)
              .get('/api/notes')
              .set('Authorization', `Bearer ${API_TOKEN}`)
              .expect(expectedNotes)
          );
      });

    });

    context('if given a bad/:id', ()=>{
      it('should respond with 404', ()=> {
        const noteId = 123456;
        return supertest(app)
          .delete(`/api/notes/${noteId}`)
          .set('Authorization', `Bearer ${API_TOKEN}`)
          .expect(404, {error : {message : 'note doesn\'t exist... just like my waifu'}});
      });
    });
  });

  describe('PATCH /api/notes/:notes_Id', ()=> {
    context('Given no notes', () =>{
      it('responds with 404', ()=>{
        const note_id = 123456;
        return supertest(app)
          .patch(`/api/notes/${note_id}`)
          .set('Authorization', `Bearer ${API_TOKEN}`)
          .expect(404 , {error : {message : 'note doesn\'t exist... just like my waifu' }});
      });
    });

    context('Given there are notes in the database', () =>{
      const testNotes = makeNotesArray();
      const testFolders = makeFoldersArray();

      beforeEach('insert notes', () => {
        return db
          .into('noteful_folders')
          .insert(testFolders)
          .then(() => {
            return db
              .into('noteful_notes')
              .insert(testNotes)
          })
      })

      it('it should respond with 204 and updates the note', ()=>{
        const idToUpdate = 2;
        const updateNote = {
          note_name : 'updated title',
          folder_id : 3 ,
          content : 'updated content'
        };
        const expectedNote = {
          ...testNotes[idToUpdate - 1],
          ...updateNote
        }

        return supertest(app)
          .patch(`/api/notes/${idToUpdate}`)
          .set('Authorization', `Bearer ${API_TOKEN}`)
          .send(updateNote)
          .expect(204)
          .then( res =>
            supertest(app)
            .get(`/api/notes/${idToUpdate}`)
            .set('Authorization', `Bearer ${API_TOKEN}`)
            .expect(expectedNote)
            )
      });
      it('responds with a 400 when no required fields supplied', () =>{
        const idToUpdate = 2;
        return supertest(app)
        .patch(`/api/notes/${idToUpdate}`)
        .set('Authorization', `Bearer ${API_TOKEN}`)
        .send({ irrelevantField : 'foo'})
        .expect(400, {
          error : { message : "request body must contain at less \'note_name\',\'folder_id\',\'content\' "}
        })
      })
      it('responds with 204 when updating only a subset of field', () => {
        const idToUpdate = 2 
        const updateNote = {
          note_name : 'updated note name (good enough)'
        }
        const expectedNote = {
          ...testNotes[idToUpdate - 1],
          ...updateNote
        }
        return supertest(app)
        .patch(`/api/notes/${idToUpdate}`)
        .set('Authorization', `Bearer ${API_TOKEN}`)
        .send({
          ...updateNote,
          fieldToIgnore : 'should not be in GET response'
        })
        .expect(204)
        .then(res => 
          supertest(app)
          .get(`/api/notes/${idToUpdate}`)
          .set('Authorization', `Bearer ${API_TOKEN}`)
          .expect(expectedNote)
          )
      })
    });
  });

});