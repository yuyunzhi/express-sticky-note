var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/notes', function(req, res, next) {
  console.log('/notes')
  res.send('respond with a resource 嘻嘻嘻嘻嘻嘻嘻');
});

router.post('/notes/add',function(req,res,next){
  console.log('/add')
})

router.post('/notes/edit ',function(req,res,next){
  console.log('/edit')
})

router.post('/notes/delete',function(req,res,next){
  console.log('/delete')
  res.send('respond with a resource 嘻嘻嘻嘻嘻嘻嘻');
})

module.exports = router;
