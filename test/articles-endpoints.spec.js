const knex = require('knex');
const app = require('../src/app');
const supertest = require('supertest');
const { makeArticleArray } = require('./articles.fixtures');


describe.only(' Articles Endpoints', () => {
  let db ;

  before('make knex instance', () => {
    db = knex({
      client : 'pg',
      connection : process.env.TEST_DB_URL,
    });
    app.set('db',db);
  });
  after('disconnect from db', () => db.destroy());

  before('clean the table', () => db('blogful_articles').truncate());

  afterEach('cleanup', () => db('blogful_articles').truncate());

  describe('GET /articles', () => {
    context('Given no articles', () => {
      it('responds with 200 and an empty array', () =>{
        return supertest(app)
          .get('/api/articles')
          .expect(200,[]);
      });
    });
    context('Given there are articles in the database', () => {
      const testArticles = makeArticleArray();

      beforeEach('insert articles', () => {
        return db
          .into('blogful_articles')
          .insert(testArticles);
      });

      it('responds with 200 and all of the articles', () => {
        return supertest(app)
          .get('/api/articles')
          .expect(200, testArticles);
      });
    });
  });

  describe('GET /articles/:article_id', () => {
    context('Given an XSS attack article', () => {
      const maliciousArticle = {
        id : 911,
        title: 'Naughty naughty very naughty <script>alert("xss");</script>',
        style: 'How-to',
        content: 'Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.'
      };

      beforeEach('insert malicious article', () => {
        return db
          .into('blogful_articles')
          .insert([maliciousArticle]);
      });

      it('removes XSS attack content', () => {
        return supertest(app)
          .get(`/api/articles/${maliciousArticle.id}`)
          .expect(200)
          .expect(res => {
            expect(res.body.title).to.eql('Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;');
            expect(res.body.content).to.eql('Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.');
          });
      });

    });

    context('Given an invalid Id ', () => {
      it('should return 404, and an error json message', ()=>{
        const oofId = 123456;
        return supertest(app)
          .get(`/api/articles/${oofId}`)
          .expect(404, {error : {message : 'Article doesn\'t exist... just like my waifu'}});
      });
    });

    context('Given there are articles in the database', () => {
      const testArticles = makeArticleArray();

      beforeEach('insert articles', () => {
        return db
          .into('blogful_articles')
          .insert(testArticles);
      });

      it('responds with 200 and the specified article', () => {
        const articleId = 2;
        const expectedArticle = testArticles[articleId - 1];
        return supertest(app)
          .get(`/api/articles/${articleId}`)
          .expect(200, expectedArticle);
      });
    });
  });
  describe('POST /articles', () => {

    it('should create an article, and responding with a 201 and the new article ', () =>{
      
      const newTestItem = {
        title: 'Test',
        style: 'Listicle',
        content: 'Test new content'
      };

      return supertest(app)
        .post('/api/articles')
        .send(newTestItem )
        .expect(201)
        .expect(res => {
          expect(res.body.title).to.eql(newTestItem.title);
          expect(res.body.style).to.eql(newTestItem.style);
          expect(res.body.content).to.eql(newTestItem.content);
          expect(res.body).to.have.property('id');
          expect(res.headers.location).to.eql(`/api/articles/${res.body.id}`);
          const expected = new Date().toLocaleString();
          const actual = new Date(res.body.date_published).toLocaleString();
          expect(actual).to.eql(expected);
        })
        .then(postRes =>{
          return supertest(app)
            .get(`/api/articles/${postRes.body.id}`)
            .expect(postRes.body);
        } 
        
        );
    });

    context('if given a bad json it should.. ', () => {
      const requestFields = [ 'title','style','content'];
      requestFields.forEach( f => {
        const newOofTestItem = {
          title: ' oof Test',
          style: 'Listicle',
          content: ' oof Test new content'
        };
        it(`responds with 400 and an error message when the ${f} is missing `, () => {
          delete newOofTestItem[f];
  
          return supertest(app)
            .post('/api/articles')
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

  describe('DELETE /articles/:articles_id', ()=> {
  
    context('Given there are articles in the database', ()=>{
      const testArticles = makeArticleArray();

      beforeEach('insert articles',() =>{
        return db.into('blogful_articles').insert(testArticles);
      });
      it('should responds with 204 and removes the target', () => {
        const idToRemove = 2;
        const expectedArticles = testArticles.filter(article => article.id !== idToRemove);
        return supertest(app)
          .delete(`/api/articles/${idToRemove}`)
          .expect(204)
          .then(res => 
            supertest(app)
              .get('/api/articles')
              .expect(expectedArticles)
          );
      });

    });

    context('if given a bad/:id', ()=>{
      it('should respond with 404', ()=> {
        const artId = 123456;
        return supertest(app)
          .delete(`/api/articles/${artId}`)
          .expect(404, {error : {message : 'Article doesn\'t exist... just like my waifu'}});
      });
    });
  });

  describe('PATCH /api/articals/:articles_Id', ()=> {
    context('Given no articles', () =>{
      it('responds with 404', ()=>{
        const article_id = 123456;
        return supertest(app)
          .patch(`/api/articles/${article_id}`)
          .expect(404 , {error : {message : 'Article doesn\'t exist... just like my waifu' }});
      });
    });

    context('Given there are articles in the database', () =>{
      const testArry = makeArticleArray();
      beforeEach('insert articles', () => {
        return db.into('blogful_articles').insert(testArry);
      });

      it('it should respond with 204 and updates the article', ()=>{
        const idToUpdate = 2;
        const updateArticle = {
          title : 'updated title',
          style : 'Interview',
          content : 'updated content'
        };
        const expectedArticle = {
          ...testArry[idToUpdate - 1],
          ...updateArticle
        }

        return supertest(app)
          .patch(`/api/articles/${idToUpdate}`)
          .send(updateArticle)
          .expect(204)
          .then( res =>
            supertest(app)
            .get(`/api/articles/${idToUpdate}`)
            .expect(expectedArticle)
            )
      });
      it('responds with a 400 when no required fields supplied', () =>{
        const idToUpdate = 2;
        return supertest(app)
        .patch(`/api/articles/${idToUpdate}`)
        .send({ irrelevantField : 'foo'})
        .expect(400, {
          error : { message : "request body must contain at less 'title','style','content' "}
        })
      })
      it('responds with 204 when updating only a subset of field', () => {
        const idToUpdate =2 
        const updateArticle = {
          title: 'updated article title'
        }
        const expectedArticle = {
          ...testArry[idToUpdate - 1],
          ...updateArticle
        }
        return supertest(app)
        .patch(`/api/articles/${idToUpdate}`)
        .send({
          ...updateArticle,
          fieldToIgnore : 'should not be in GET response'
        })
        .expect(204)
        .then(res => 
          supertest(app)
          .get(`/api/articles/${idToUpdate}`)
          .expect(expectedArticle)
          )
      })
    });
  });

});