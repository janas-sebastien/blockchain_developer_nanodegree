/*
*
*	Submission for project 2: Private Blockchain
*	Author: Sébastien Janas
*	Date: 02/09/2018
* 
*	That file contains the leveldb functions (from levelSandbox.js)
*	and the part related to the blockchain (from simpleChain.js)
*/



/* ===== Persist data with LevelDB ===================================
|  Learn more: level: https://github.com/Level/level     |
|  =============================================================*/

const level = require('level');
const chainDB = './chaindata';
const db = level(chainDB);

// Add data to levelDB with key/value pair
function addLevelDBData(key,value){
  db.put(key, value, function(err) {
    if (err) return console.log('Block ' + key + ' submission failed', err);
  })
}

// Get data from levelDB with key
function getLevelDBData(key){
  return db.get(key);
}

// Add data to levelDB with value
function addDataToLevelDB(value) {
    let i = 0;
    db.createReadStream().on('data', function(data) {
          i++;
        }).on('error', function(err) {
            return console.log('Unable to read data stream!', err)
        }).on('close', function() {
          console.log('Block #' + i);
          addLevelDBData(i, value);
        });
}

/* ===== SHA256 with Crypto-js ===============================
|  Learn more: Crypto-js: https://github.com/brix/crypto-js  |
|  =========================================================*/

const SHA256 = require('crypto-js/sha256');


/* ===== Block Class ==============================
|  Class with a constructor for block 			   |
|  ===============================================*/

class Block{
	constructor(data){
     this.hash = "",
     this.height = 0,
     this.body = data,
     this.time = 0,
     this.previousBlockHash = ""
    }
}

/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

class Blockchain{
  constructor(){
	this.getBlockHeight().then( (height) => {
		if ( height === 0 ){
			this.addBlock(new Block("First block in the chain - Genesis block"));
		}
	})
  }

  // Add new block
  addBlock(newBlock){
	  
	this.getBlockHeight().then( (height) => {
		// Block height
		newBlock.height = height;
		
		// UTC timestamp
		newBlock.time = new Date().getTime().toString().slice(0,-3);
		
		// previous block hash
		if(newBlock.height > 0){
			let key = newBlock.height - 1;
			this.getBlock(key).then((prevblock) => {
				newBlock.previousBlockHash = JSON.parse(prevblock).hash;
				newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
				addLevelDBData(newBlock.height,JSON.stringify(newBlock).toString());
			})
		} else {
			newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
			addLevelDBData(newBlock.height,JSON.stringify(newBlock).toString());
		}
	})
  }

  // Get block height
    getBlockHeight(){
	  return new Promise ((resolve,reject) => {
		let height = 0;
		db.createReadStream({keys:true,values:false})
		.on('data', () => { ++height } )
		.on('error', (error) => {reject(error)})
		.on('close', () => {resolve(height)})
	  })
    }

	// Display Block Height (for testing)
	displayBlockHeight(){
		this.getBlockHeight()
		.then( (height) => {console.log(height)})
	}
	
    // get block
    getBlock(blockHeight){
      return getLevelDBData(blockHeight);
    }

	// change the content of the data field for a specific block
	// (for testing)
	messWithData(blockHeight,data){
		this.getBlock(blockHeight)
		.then( (blockstring) => {
			let block = JSON.parse(blockstring);
			block.data = data;
			addLevelDBData(blockHeight,JSON.stringify(block).toString());
		})
	}
	
	
    // validate block
    validateBlock(blockHeight){

		return new Promise( (resolve,reject) => {
	  
			// get block object
			this.getBlock(blockHeight).then( (blockstring) => {
				// Get block
				let block = JSON.parse(blockstring);
				// get block hash
				let blockHash = block.hash;
				// remove block hash to test block integrity
				block.hash = '';
				// generate block hash
				let validBlockHash = SHA256(JSON.stringify(block)).toString();
				// Compare
				if (blockHash===validBlockHash) {
					resolve(true);
				} else {
					console.log('Block #'+blockHeight+' invalid hash:\n'+blockHash+'<>'+validBlockHash);
					reject(false);
				}
			}); 
		})
	}
	
   // Validate blockchain
    validateChain(){
		let errorLog = [];
		let chain = [];

		db.createReadStream({keys:true,values:true})
		.on('data', (block) => { 
			chain.push(JSON.parse(block.value));
		})
		.on('close', () => {
			for (var i = 0; i < chain.length; i++) {
				let hash = chain[i].hash;
				let block = chain[i];
				block.hash = '';
				let validBlockHash = SHA256(JSON.stringify(block)).toString();
				if (validBlockHash !== hash){
					console.log('Block #'+i+' invalid hash:\n')
					console.log(hash+'<>'+validBlockHash+'\n');
					errorLog.push(i);
					continue;
				}
				if (i < chain.length - 1){
					if (hash !== chain[i+1].previousBlockHash){
						console.log('Block #'+i+' hash does not match the previous hash of next block.\n')
						console.log(hash+'<>'+chain[i+1].previousBlockHash+'\n');
						errorLog.push(i);
					}
				}
			}
			
			if (errorLog.length>0) {
				console.log('Block errors = ' + errorLog.length);
				console.log('Blocks: '+errorLog);
			} else {
				console.log('No errors detected');
			}
		})
    }
}

module.exports = {
    Block,
    Blockchain 
};
