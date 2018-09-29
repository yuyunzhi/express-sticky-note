
var Sequelize = require('sequelize')
var path = require('path')

var sequelize = new Sequelize(undefined,undefined,undefined, { 
    host: 'localhost', 
    dialect: 'sqlite',
    storage: path.join(__dirname,'../database/database.sqlite')
});

// sequelize
//     .authenticate()
//     .then(() => {
//         console.log('Connection has been established successfully.');
//     })
//     .catch(err => {
//         console.error('Unable to connect to the database:', err);
//     });

var Note = sequelize.define('note', {
    text:{
        type:Sequelize.STRING
    },
    uid:{
        type:Sequelize.STRING
    }
  });

// Note.sync().then(function(){
//     Note.create({
//         text:'hello world',
//          }).then(function(){
//         Note.findAll({raw:true}).then(function(notes){
//             console.log(notes)
//         })
//     })
//   });

module.exports.Note = Note;