const express = require('express');
const bodyParser = require('body-parser');
const {Block,Blockchain} = require('./simpleChain.js');

// Set up the express app
const app = express();

// Use bodyParser as middle-ware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

let bk = new Blockchain();


app.get('/block/:id', function(req, res){

	var height = req.params.id;

	bk.getBlock(height)
	.catch( function(){
		res.status(400).send("Block not found");
	})
	.then( function(block){
		res.status(200).send(block);
	})

});

app.post('/block/',function(req,res){
	var block=req.body.block;

	if(block){
		bk.addBlock(new Block(block));
		res.status(200).send(block);
	} else {
		res.status(401).send("Cannot add empty block\n");
	}
});

//Start the app
const PORT = 8000;
app.listen(PORT, () => {
	console.log(`server running on port ${PORT}`)
});
