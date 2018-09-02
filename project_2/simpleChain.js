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

	validateLink(blockHeight){
		
		return new Promise( (resolve,reject) => {
			this.getBlock(blockHeight).then( (blockstring) => {
				let block = JSON.parse(blockstring);
				let blockHash = block.hash;
				let nextblocknumber = blockHeight + 1;
				this.getBlock(nextblocknumber).then( (nextblockstring) => {
					let nextblock = JSON.parse(nextblockstring);
					let previousHash = nextblock.previousBlockHash;			
					if (blockHash!==previousHash) {
						console.log('Block #'+blockHeight+' hash does not match the previous hash of block '+ nextblocknumber + '\n')
						console.log(blockHash + '<>' + previousHash + '\n');
						reject(false);
					} else {
						resolve(true)
					}
				})
			})
		})
	}
	
   // Validate blockchain
    validateChain(){
		let promises = [];
		
		// Check hashes
		this.getBlockHeight().then( (height) => {
			// height is the total number of blocks
			// and keys start at 0
			// so the last block has a key = height -1
			for (var i = 0; i < height; i++){
				promises.push(this.validateBlock(i));
				// We cannot check the previous hash of the block after the last block
				// ... since it is the last block !
				if (i < (height -1)) promises.push(this.validateLink(i));
			}
		})

		
		Promise.all(promises)
		.then( (results) => {console.log("The blockchain is valid")})
		.catch( (error) => {console.log("The blockchain is invalid")})

    }
}
