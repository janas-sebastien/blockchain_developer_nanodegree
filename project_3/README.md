# Blockchain Developer Nanodegree: Project 3

RESTful Web API with Node.js Framework

### Prerequisites

You will need node.js to run that application.

### Installing

Installing that package is as easy as copying the content of the directory on your system.

### Running the application

```
node app.js
```

### Enpoints description

#### GET endpoint

URL
```
http://<hostname>:8000/block/[blockheight]
```

The REST API returns the content of block [blockheight], in JSON format.

#### POST endpoint

URL
```
http://<hostname>:8000/block/
```

The content of the block is provided in the parameter "block" of the POST request. If successful, the REST API returns the content of the block, in JSON format.

### Test endpoints with Curl

#### GET endpoint

```
curl -v -H "Accept: application/json" -H "Content-type: application/json"  http://<hostname>:8000/block/[blockheight]
```

#### POST endpoint

```
curl -v -H "Accept: application/json" -H "Content-type: application/json" -d '{"block":"block2"}' http://<hostname>:8000/block/
```

## Built With

* [Express](https://expressjs.com) - The web framework used
* [levelDB](http://leveldb.org/) - Database
* [crypto-js](https://github.com/brix/crypto-js) - Cryptographic functions

## Authors

**Sébastien JANAS**

