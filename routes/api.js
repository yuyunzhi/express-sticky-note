var express = require('express');
var router = express.Router();
var Note = require('../model/node').Note;

/* GET users listing. */
router.get('/notes', function(req, res, next) {
  //  前端不传任何东西，返回note的数据
  Note.findAll({raw:true}).then(function(notes){  
      res.send({status:0,data:notes})
  })
});

router.post('/notes/add',function(req,res,next){
  var notes = req.body.note
  Note.create({text:notes}).then(()=>{
    res.send({status:0})
  }).catch(()=>{
    res.send({status:1,error:"数据库出错"})
  })

})

router.post('/notes/edit',function(req,res,next){
  Note.update({text:req.body.note},{where:{id:req.body.id}}).then(function(){
    res.send({status:0})
  })

})

router.post('/notes/delete',function(req,res,next){
  Note.destroy({where:{id:req.body.id}}).then(()=>{
    res.send({status:0})
  })
})

module.exports = router;
