const FoldersService ={
  getAllFolders(db) {
    return db
      .select()
      .from('noteful_folders');
  },

  insertFolder(db,newFolder) {
    return db
      .insert(newFolder)
      .into('noteful_folders')
      .returning('*')
      .then(rows => rows[0]);
  },

  getFoldersById(db,id){
    return db.select()
      .from('noteful_folders')
      .where('id',id)
      .first();
  },

  deleteFolders(db,id){
    return db('noteful_folders')
      .where({id})
      .delete();
  },

  updateFolders(db,id,newFolderFields){
    return db('noteful_folders')
      .where({id})
      .update(newFolderFields);
  }

};

module.exports = FoldersService ; 