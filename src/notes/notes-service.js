const NotesService ={
  getAllNotes(db) {
    return db
      .select()
      .from('noteful_notes');
  },
    
  insertNotes(db,newNote) {
    return db
      .insert(newNote)
      .into('noteful_notes')
      .returning('*')
      .then(rows => rows[0]);
  },
    
  getNotesById(db,id){
    return db.select()
      .from('noteful_notes')
      .where('id',id)
      .first();
  },
    
  deleteNote(db,id){
    return db('noteful_notes')
      .where({id})
      .delete();
  },
    
  updateNote(db,id,newNoteFields){
    return db('noteful_notes')
      .where({id})
      .update(newNoteFields);
  }
    
};
    
module.exports = NotesService ; 