const CommentsService ={
  getAllComments(db) {
    return db
      .select()
      .from('blogful_comments');
  },
    
  insertComments(db,newComment) {
    return db
      .insert(newComment)
      .into('blogful_comments')
      .returning('*')
      .then(rows => rows[0]);
  },
    
  getCommentsById(db,id){
    return db.select()
      .from('blogful_comments')
      .where('id',id)
      .first();
  },
    
  deleteComment(db,id){
    return db('blogful_comments')
      .where({id})
      .delete();
  },
    
  updateComment(db,id,newCommentsFields){
    return db('blogful_comments')
      .where({id})
      .update(newCommentsFields);
  }
    
};
    
module.exports = CommentsService ; 