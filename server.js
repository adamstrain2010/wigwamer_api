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
	//console.log("App now running on port ", port);
});
//INITIALISING CONNECTION STRING 
var dbConfig = {
	user: "sa",
	password: "wigwamer",
	server: "wigwamer.cmrum3gstke6.eu-west-1.rds.amazonaws.com",
	database: "pms"
};

var wwServerConfig = {
	user: "sa",
	password: "W1gw@m3r!",
	server: "wigwamer.com",
	database: "pms"
}
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

var executeWWQuery = function(res, query){
     sql.close();
	 sql.connect(wwServerConfig, function (err) {
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


app.get("/api/testing",function(req,res){
	var query = 'select * from "user"';
	executeWWQuery(res, query);
});

//USERS
app.get("/api/user", function(req,res){
	var property = req.query.property;
 	var usernmae = req.query.user;
	var pass = req.query.pass;
	var query = "SELECT * FROM users";
	executeQuery(res, query);
});

//RESERVATION
	//SEARCH
app.get("/api/search", function(req,res){
	var query = "SELECT * FROM reservations WHERE reservationName like '%" + req.query.searchTerm + "%'";
	executeQuery(res, query);
});

//!!POST API !!

//USERS
app.post("/api/checkUser", function(req,res){
	console.log("SELECT * FROM users WHERE username='" + req.query.username + "' AND organisation = " + req.query.organisation + " AND password = '" + req.query.password + "'");
	//var query = "SELECT userid FROM users WHERE username='" + req.query.username + "' AND organisation = " + req.query.organisation + " AND password = '" + req.query.password + "'";
	var query = "SELECT * FROM users WHERE username='" + req.query.username + "' AND organisation = " + req.query.organisation + " AND password = '" + req.query.password + "'";
	executeQuery(res,query);
});

//RESERVATIONS
	//GET RESERVATIONS BY ARRIVALDATE
app.post("/api/reservations", function(req,res){
        console.log("SELECT * FROM reservations WHERE arrivalDate = '" + req.query.arrivalDate +  "' AND reservationStatusId = 1");
        var query = "SELECT * FROM reservations r JOIN bookingSource bs on r.bookingSource = bs.bookingSOurceId WHERE arrivalDate = '" + req.query.arrivalDate + "' AND reservationStatusId = 1";
        executeQuery(res,query);
});

//GET DEPARTING RESERVATIONS
	//using 4 as checked in status
app.post("/api/reservationsByDepartDate", function(req,res){
		console.log("SELECT * FROM reservations WHERE departureDate = '" + req.query.departDate + "' AND reservationStatusId = 4");
		var query = "SELECT * FROM reservations WHERE departureDate = '" + req.query.departDate + "' AND reservationStatusId = 4";
		console.log(query);
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
	console.log("SELECT * FROM reservations WHERE reservationStatusId = 4");
	var query = "SELECT * FROM reservations WHERE reservationStatusId = 4";
	executeQuery(res, query)
});

app.post("/api/createReservation",function(req,res){
	console.log("INSERT INTO reservations (surname,forename, reservationName, arrivalDate, departureDate, bookingSource, reservationStatusId) VALUES ('dylan', 'bob', 'dylan, bob' ,'2017-11-01', '2017-11-01', 2, 1)");
	var query = "INSERT INTO reservations (surname,forename, reservationName, arrivalDate, departureDate, bookingSource, reservationStatusId) VALUES ('dylan', 'bob', 'dylan, bob' ,'2017-11-01', '2017-11-02', 2, 1)";
	executeQuery(res, query);
});

app.post("/api/checkIn", function(req,res){
	var query = "UPDATE reservations SET reservationStatusId = 4 WHERE reservationId = " + req.query.reservationNum;
	executeQuery(res, query);
});

app.post("/api/checkOut", function(req,res){
	var query = "UPDATE reservations SET reservationStatusId = 5 WHERE reservationId = " + req.query.reservationNum;
	executeQuery(res, query);
});

app.post("/api/cancelReservation", function(req,res){
	var query = "UPDATE reservations SET reservationStatusId = 2 WHERE reservationId = " + req.query.reservationNum;
	console.log(query);
	executeQuery(res, query);
});

//PUT API

//NEW RESERVATION

// function test(){
	// var conn = new sql.ConnectionPool(dbConfig);
	// conn.connect().then(function(conn){
		// var request = new sql.Request(conn);
		// request.input('surname', sql.NVarChar(50), "strainoger");
		// request.input('forename', sql.NVarChar(50), "adam");
		// request.input('arrivalDate', sql.NVarChar(50), '2017-12-01');
		// request.input('departureDate', sql.NVarChar(50), '2017-12-01');
		// request.input('bookingSource', sql.Int, 1);
		// request.input('reservationStatus', sql.Int, 1);
		// request.execute('sp_InsertReservation')
		// .then(function(err, recordsets, returnValue, affected){
			// console.log(recordsets);
			// console.log(err);
		// })
		// .catch(function(err){
			// console.log(err);
		// });
	// })
// }

// test();

app.post("/api/saveReservation", function(req,res){
	// var query = "INSERT INTO reservations (surname,forename,reservationName, arrivalDate, departureDate, bookingSource, reservationStatusId) VALUES ('" + req.query.surname + "','" + req.query.forename + "','" + req.query.surname + "," + req.query.forename + "','" + req.query.arrivalDate + "','" + req.query.departureDate + "'," + "1,1)";
	query = "EXEC pms..sp_InsertReservation '" + req.query.surname + "','" + req.query.forename + "', '" + req.query.arrivalDate + "','" + req.query.departureDate + "', 1, 1";
	// console.log(query);
	// executeQuery(res,req);
	var conn = new sql.ConnectionPool(dbConfig);
	conn.connect().then(function(conn){
		var request = new sql.Request(conn);
		request.input('surname', sql.NVarChar(50), req.query.surname);
		request.input('forename', sql.NVarChar(50), req.query.forename);
		request.input('arrivalDate', sql.NVarChar(50), req.query.arrivalDate);
		request.input('departureDate', sql.NVarChar(50), req.query.departureDate);
		request.input('bookingSource', sql.Int, req.query.bookingSource);
		request.input('reservationStatus', sql.Int, 1);
		request.execute('sp_InsertReservation')
		.then(function(err, recordsets, returnValue, affected){
			console.log(recordsets);
			res.send(err);
		})
		.catch(function(err){
			res.send(err);
			console.log(err);
		});
	})
	
	// var conn = new sql.ConnectionPool(dbConfig);
	// sql.connect().then(function(conn){
		// var request = new sql.Request(conn);
		// request.input('surname', sql.NVarChar(50), req.query.surname);
		// request.input('forename', sql.NVarChar(50), req.query.forename);
		// request.input('arrivalDate', sql.NVarChar(50), req.query.arrivalDate);
		// request.input('departureDate', sql.NVarChar(50), req.query.departureDate);
		// request.input('bookingSource', sql.Int, 1);
		// request.input('reservationStatus', sql.Int, 1);
		// request.execute('sp_InsertReservation')
		// .then(function(err, recordsets, returnValue, affected){
			// console.dir(recordsets);
			// console.dir(err);
		// })
		// .catch(function(err){
			// console.log(err);
		// });
	// }) 
});

//SAVE RESERVATION
app.put("/api/saveReservation", function(req,res){
	console.log(req.query);
	console.log( "UPDATE reservations SET surname = '" + req.query.surname + "', forename = '" + req.query.forename + "', reservationName  = '" + req.query.surname + "' WHERE reservationId = " + req.query.reservationId);
	var query = "UPDATE reservations SET surname = '" + req.query.surname + "', forename = '" + req.query.forename + "', reservationName  = '" + req.query.surname + "' WHERE reservationId = " + req.query.reservationId ;
	executeQuery(res, req); 
});

