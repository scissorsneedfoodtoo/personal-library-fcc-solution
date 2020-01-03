/*
*
*
*       FILL IN EACH ROUTE BELOW COMPLETELY
*       
*       
*/

'use strict';

const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
const CONNECTION_STRING = process.env.DB_URI;

module.exports = function (app) {

  app.route('/api/books')
    .get((req, res) => {
      MongoClient.connect(CONNECTION_STRING, { useUnifiedTopology: true }, (err, client) => {
        const db = client.db('personalLibrary');
        const collection = db.collection('books');
        collection.find().toArray((err, books) => {
          books.forEach(book => {
            book.commentCount = book.comments.length;
            delete book.comments;
          });

          res.json(books);
        });
      });
    })

    .post(function (req, res) {
      const title = req.body.title;

      if(!title) {
        res.send('Missing title');
      } else {
        MongoClient.connect(CONNECTION_STRING, { useUnifiedTopology: true }, (err, client) => {
          const db = client.db('personalLibrary');
          const collection = db.collection('books');
          const doc = { title: title, comments: [] };

          collection.findOne(doc, (err, result) => {
            // Exit if title already exists in library
            if (result) return res.send('Title already exists');

            collection.insertOne(doc, (err, result) => {
              res.json(result.ops[0]);
            });
          });
        });
      }
    })

    .delete((req, res) => {
      MongoClient.connect(CONNECTION_STRING, { useUnifiedTopology: true }, (err, client) => {
        const db = client.db('personalLibrary');
        const collection = db.collection('books');
        collection.deleteMany({});

        res.send("Complete deletion successful");
      });
    });
    
  app.route('/api/books/:id')
    .get((req, res) => {
      const bookId = req.params.id;
      // Must convert param string to Mongo object Id to search for it in db
      const oid = new ObjectId(bookId);
      MongoClient.connect(CONNECTION_STRING, { useUnifiedTopology: true }, (err, client) => {
        const db = client.db('personalLibrary');
        const collection = db.collection('books');

        collection.find({ _id: oid }).toArray((err, result) => {
          if (result.length === 0) {
            res.send('No book exists');
          } else {
            res.json(result[0]);
          }
        });
      });
      // Format: { "_id": bookId, "title": bookTitle, "comments": [comment, comment,...] }
    })

    .post((req, res) => {
      const bookId = req.params.id;
      // Must convert param string to Mongo object Id to search for it in db
      const oid = new ObjectId(bookId);
      const comment = req.body.comment;

      // Exit early if there is no comment
      if (!comment) return res.send('Missing comment');

      MongoClient.connect(CONNECTION_STRING, { useUnifiedTopology: true }, (err, client) => {
        const db = client.db('personalLibrary');
        const collection = db.collection('books');

        collection.findOneAndUpdate(
          {_id: oid},
          {$push: { comments: comment }},
          {returnOriginal: false},
          (err, result) => {
            res.json(result.value);
          });
      });
    })
    
    .delete((req, res) => {
      const bookId = req.params.id;
      // Must convert param string to Mongo object Id to search for it in db
      const oid = new ObjectId(bookId);

      MongoClient.connect(CONNECTION_STRING, { useUnifiedTopology: true }, (err, client) => {
        const db = client.db('personalLibrary');
        const collection = db.collection('books');

        collection.findOneAndDelete({ _id: oid }, (err, result) => {
          res.send("Deletion successful");
        });
      });
    });
  
};
