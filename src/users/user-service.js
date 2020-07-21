const UserService ={
  getAllUsers(db) {
    return db
      .select()
      .from('blogful_users');
  },
  
  insertUser(db,newUser) {
    return db
      .insert(newUser)
      .into('blogful_users')
      .returning('*')
      .then(rows => rows[0]);
  },
  
  getUserById(db,id){
    return db.select()
      .from('blogful_users')
      .where('id',id)
      .first();
  },
  
  deleteUser(db,id){
    return db('blogful_users')
      .where({id})
      .delete();
  },
  
  updateUser(db,id,newUserFields){
    return db('blogful_users')
      .where({id})
      .update(newUserFields);
  }
  
};
  
module.exports = UserService ; 