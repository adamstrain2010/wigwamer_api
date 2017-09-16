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
     sql.close();
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
	//GET RESERVATIONS BY ARRIVALDATE
app.post("/api/reservations", function(req,res){
        console.log("SELECT * FROM reservations WHERE arrivalDate = '" + req.query.arrivalDate +  "' AND reservationStatusId = 1");
        var query = "SELECT * FROM reservations WHERE arrivalDate = '" + req.query.arrivalDate + "'";
        executeQuery(res,query);
});

//GET DEPARTING RESERVATIONS
	//using 4 as checked in status
app.post("/api/reservationsByDepartDate", function(req,res){
		console.log("SELECT * FROM reservations WHERE departureDate = '" + req.query.departDate + "' AND reservationStatusId = 4");
		var query = "SELECT * FROM reservations WHERE departureDate = '" + req.query.departDate + "'";
		executeQuery(res, query);
})

//GET SPECIFIC RESERVATION BY RESERVATIONNUM
app.post("/api/getReservation", function(req,res){
	console.log("SELECT * FROM reservations WHERE reservationId = " + req.query.reservationId);
	var query = "SELECT * FROM reservations WHERE reservationId = " + req.query.reservationId;
	executeQuery(res,query);
});

//GET IN HOUSE RESERVATIONS
app.post("/api/reservationsInHouse", function(req,res){
	console.log("SELECT * FROM reservations WHERE reservationId = 4");
	var query = "SELECT * FROM reservations WHERE reservationStatusId = 4";
	executeQuery(res, query)
});

//PUT API

//SAVE RESERVATION
app.put("/api/saveReservation", function(req,res){
	console.log(req.query);
	console.log( "UPDATE reservations SET surname = '" + req.query.surname + "', forename = '" + req.query.forename + "', reservationName  = '" + req.query.surname + "' WHERE reservationId = " + req.query.reservationId);
	var query = "UPDATE reservations SET surname = '" + req.query.surname + "', forename = '" + req.query.forename + "', reservationName  = '" + req.query.surname + "' WHERE reservationId = " + req.query.reservationId ;
	executeQuery(res, req); 
});

