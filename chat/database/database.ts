var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";

MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  var dbo = db.db("ircdb");
  dbo.createCollection("users", function(err, res) {
    if (err) throw err;
    console.log("Collection created!");
  });
  dbo.createCollection("rooms", function(err, res) {
    if (err) throw err;
    console.log("Collection created!");

  });
  dbo.createCollection("messages", function(err, res) {
    if (err) throw err;
    console.log("Collection created!");
    db.close();
  });

});
