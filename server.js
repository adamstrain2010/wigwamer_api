var express = require("express");
var bodyParser = require("body-parser");
var sql = require("mssql");
var app = express();
app.use(bodyParser.json());

//CORS MIDDLEWARE 
app.use(function(req,res,next){
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, contentType,Content-Type, Accept, Authorization");
    next();
});
//SETTING UP SERVER 
var server = app.listen(process.env.PORT || 1234, function(){
	var port = server.address().port;
	console.log("App now running on port ", port);
});
//INITIALISING CONNECTION STRING 
var dbConfig = {
	user: "sa",
	password: "wigwamer",
	server: "wigwamer.cmrum3gstke6.eu-west-1.rds.amazonaws.com",
	database: "pms"
};
//FUNCTION TO CONNECT TO DB AND EXEC QUERY 
var executeQuery = function(res, query){
     sql.connect(dbConfig, function (err) {
         if (err) {
                     console.log("Error while connecting database :- " + err);
                     res.send(err);
		     sql.close();
                  }
         else {
		// create Request object
                var request = new sql.Request();
                // query to the database
                request.query(query, function (err,rs) {
                	if (err) {
                        	console.log("Error while querying database :- " + err);
                        	res.send(err);
				sql.close();
                        }
                        else {
                                res.send(rs);
				sql.close();
                        }
                });
         }
      })
}
//!!GET API!! 

//USERS
app.get("/api/user", function(req,res){
	var property = req.query.property;
 	var usernmae = req.query.user;
	var pass = req.query.pass;
	var query = "SELECT * FROM users";
	executeQuery(res, query);
});



//!!POST API !!

//USERS
app.post("/api/checkUser", function(req,res){
	console.log("SELECT userid FROM users WHERE username='" + req.query.username + "' AND organisation = " + req.query.organisation + " AND password = '" + req.query.password + "'");
	var query = "SELECT userid FROM users WHERE username='" + req.query.username + "' AND organisation = " + req.query.organisation + " AND password = '" + req.query.password + "'";
	executeQuery(res,query);
});

//RESERVATIONS
app.post("/api/reservations", function(req,res){
        console.log("SELECT * FROM reservations WHERE arrivalDate = '" + req.query.arrivalDate +  "'");
        var query = "SELECT * FROM reservations WHERE arrivalDate = '" + req.query.arrivalDate + "'";
        executeQuery(res,query);
});

