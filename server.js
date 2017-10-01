var express = require("express");
var bodyParser = require("body-parser");
var sql = require("mssql");
var sqlSeriate = require("seriate");
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

app.get("/api/getSystemDate", function(req, res){
	var query = "select top 1 systemdate from systemdates";
	console.log("GETTING SYSTEM DATE");
	console.log(query);
	executeWWQuery(res, query);
});


sqlSeriate.setDefaultConfig(wwServerConfig);

function testing123(clientId, propertyId, rateCodeId, unitTypeId, fromDate, toDate){
    return sqlSeriate.execute({
        procedure: "sp_getRatesAndAvailability",
        params: {
            idclient: {
                type: sqlSeriate.INT,
                val: clientId
            },
            idproperty: {
                type: sqlSeriate.INT,
                val: propertyId
            },
            idratecode: {
                type: sqlSeriate.INT,
                val: rateCodeId
            },
            idunittype: {
                type: sqlSeriate.INT,
                val: unitTypeId
            },
			fromdate:{
            	type: sqlSeriate.DATE,
				val: fromDate
			},
            todate:{
                type: sqlSeriate.DATE,
                val: toDate
            }
        }
    })
}

function testingYep(){
    return sqlSeriate.execute({
        query: "SELECT * FROM reservations",
	})
	.then(function(result){
		return result;
	});
};

app.get("/api/testingRoute", async function(req,res) {
    let out;
	out = await testing123(req.query.clientId, req.query.propertyId, req.query.rateCodeId, req.query.unitTypeId, req.query.fromDate, req.query.toDate);
    console.dir(out);
	res.send(out);
})

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
	var query = "SELECT * FROM reservations WHERE reservationname like '%" + req.query.searchTerm + "%'";
	console.log(query);
	executeWWQuery(res, query);
});

//APP
	//GET ROOM TYPES
app.get("/api/getRoomTypes", function(req, res){
	var query = "SELECT * FROM unittype WHERE inuse = 'Y' AND idproperty = " + req.query.organisationId;
	console.log(query);
	executeWWQuery(res, query);
})

	//GET ROOMS BASED ON ROOM TYPES
app.get('/api/getRoomsBasedOnRoomType', function(req, res){
	var query = "SELECT * FROM units WHERE idunittype = " + req.query.roomTypeId + " AND inuse = 'Y'";
	console.log(query);
	executeWWQuery(res,query);
});


app.get("/api/getAllNationalities", function(req,res){
	var query = "SELECT idcountry, countryname, countryiso3 FROM country";
	console.log(query);	
	executeWWQuery(res,query);
});

//var toAdd = {"extraId": scope.chargeType.idextras, "extraDesc": scope.chargeType.extrasdescription ,"extraType": scope.chargeType, "qty": scope.extrasQuantity, "unitPrice": "£" + (2.2).toFixed(2), "subTotal": "£" + (scope.extrasQuantity * 2.2).toFixed(2)};

//GET EXTRAS FROM RESERVATION ID
app.get("/api/getReservationExtras", function(req,res){
	var query = "SELECT re.idextras AS extraId, e.extrasdescription AS extraDesc, e.extrachargetype as extraType, 1 as qty, re.adultCharge as unitPrice, 1 * re.adultCharge as subTotal FROM reservations_extras re JOIN extras e on re.idextras = e.idextras WHERE idreservation = " + req.query.idReservation;
	console.log(query);
	executeWWQuery(res, query);
})

//AVAILABILITY
	//GET AVAILABILITY FROM DATE RANGE
app.get("/api/getAvailabilityRange", function(req,res){
    sql.connect(wwServerConfig).then(pool =>{
    	return pool.request()
        .input('idclient', sql.Int, req.query.clientId)
		.input('idproperty', sql.Int, req.query.propertyId)
		.input('idratecode', sql.Int, req.query.rateCodeId)
		.input('idunittype', sql.Int, req.query.unitTypeId)
		.input('fromdate', sql.NVarChar(50), req.query.fromDate)
		.input('todate', sql.NVarChar(50), req.query.todate)
		.execute('sp_getRatesandAvailability', (err, result) => {
			err ? console.dir(err) : console.dir(result)
		})
	})
});

function InsertExtra(clientId, propertyId, extraId, reservationId, chargeDate, accomInclTax,accomExclTax,
                     adultCharge, childCharge, infantCharge, fixedCharge, totalFlatCharge){
    return sqlSeriate.execute({
        procedure: "sp_insertExtras",
        params: {
            idclient: {
                type: sqlSeriate.INT,
                val: clientId
            },
            idproperty: {
                type: sqlSeriate.INT,
                val: propertyId
            },
            idextras: {
                type: sqlSeriate.INT,
                val: extraId
            },
            idreservation: {
                type: sqlSeriate.INT,
                val: reservationId
            },
            chargedate:{
                type: sqlSeriate.DATE,
                val: chargeDate
            },
            accommodationicltax:{
                type: sqlSeriate.INT,
                val: accomInclTax
            },
            accommodationexcltax:{
                type: sqlSeriate.INT,
                val: accomExclTax
            },
			adultcharge:{
                type: sqlSeriate.MONEY,
                val: adultCharge
            },
			childcharge:{
                type: sqlSeriate.DECIMAL,
                val: childCharge
            },
			infantcharge:{
                type: sqlSeriate.DECIMAL,
                val: infantCharge
            },
			fixedcharge:{
                type: sqlSeriate.DECIMAL,
                val: fixedCharge
            },
			totalflatcharge:{
                type: sqlSeriate.DECIMAL,
                val: totalFlatCharge
            },
		}
    })
}

function GetCharges(idReservation){
    return sqlSeriate.execute({
        procedure: "sp_ChargeBreakdown",
        params: {
            idreservation: {
                type: sqlSeriate.INT,
                val: idReservation
            }
        }
    })
}

app.post("/api/getCharges", async function(req,res){
	let out;
    out = await GetCharges(req.query.idReservation);
	res.send(out);
})

app.post("/api/insertExtra", async function(req,res) {
    let out;
    out = await InsertExtra(req.query.clientId, req.query.propertyId,
		req.query.extraId, req.query.reservationId, req.query.chargeDate, req.query.accomIncltax, req.query.accomExclTax,req.query.adultCharge,req.query.childCharge,req.query.infantCharge, req.query.fixedCharge, req.query.totalflatcharge);
    console.dir(out);
    res.send(out);
})

// app.post("/api/insertExtra", function(req,res){
// 	sql.connect(wwServerConfig).then(pool=>{
// 		return pool.request()
// 		.input('idclient', sql.Int, req.query.clientId)
// 		.input('idproperty', sql.Int, req.query.propertyId)
// 		.input('idextras', sql.Int, req.query.extraId)
// 		.input('idreservation', sql.Int, req.query.reservationId)
// 		.input('chargedate', sql.NVarChar(50), req.query.chargeDate)
// 		.input('accommodationicltax', sql.Decimal(19,4), req.query.accomInclTax)
// 		.input('accommodationexcltax', sql.Decimal(19,4), req.query.accomExclTax)
// 		.input('adultcharge', sql.Decimal(19,4), req.query.adultCharge)
// 		.input('childcharge', sql.Decimal(19,4), req.query.childCharge)
// 		.input('infantcharge', sql.Decimal(19,4), req.query.infantCharge)
// 		.input('fixedcharge', sql.Decimal(19,4), req.query.fixedCharge)
// 		.input('totalflatcharge', sql.Decimal(19,4), req.query.totalFlatCharge)
// 		.execute('sp_insertExtras', (err, result) => {
//             err ? console.dir(err) : console.dir(result)
//         })
// 	})
// });

//GET ALL SPECIALS
app.get("/api/getAllSpecials", function(req, res){
    console.log("HITTING IT! HITTING IT!!!!!!!!!!!!!!!!!!!1");
	var query = "select e.* from extras e join extrasproperty ep on e.idclient = ep.idclient and e.idclient = 1 and ep.idextrasproperty = 1";
    console.log("");
    console.log(query);
    console.log("");
    executeWWQuery(res, query);
})



//!!POST API !!


app.post("/api/checkUser", function(req,res){
	//var query = "SELECT userid FROM users WHERE username='" + req.query.username + "' AND organisation = " + req.query.organisation + " AND password = '" + req.query.password + "'";
	var query = 'SELECT * FROM "user"' + " WHERE usercode = '" + req.query.username + "' AND idclient = " + req.query.organisation + " AND password = '"	+ req.query.password + "'";
	console.log(query);
	executeWWQuery(res,query);
});

//RESERVATIONS
	//GET RESERVATIONS BY ARRIVALDATE
app.post("/api/reservations", function(req,res){
        var query = "SELECT r.idreservation, r.reservationname, r.fromdate, r.todate, rs.reservationsourcecode,rs.reservationcolour,rs.reservationsourcedescription FROM reservations r JOIN reservationsource rs ON r.idreservationsource = rs.idreservationsource WHERE fromdate = '" + req.query.arrivalDate + "' AND idreservationstatus = 1"; 
        console.log(query);
		executeWWQuery(res,query);
});

//FOR DEV TURN ALL RESERVATIONS TO RESERVATION STATUS
app.post("/api/changeAllToReservation", function(req,res){
        var query = "UPDATE reservations SET idreservationstatus = 1"; 
        console.log(query);
		executeWWQuery(res,query);
});

//GET DEPARTING RESERVATIONS
	//using 4 as checked in status
app.post("/api/reservationsByDepartDate", function(req,res){
		var query = "SELECT r.idreservation, r.reservationname, r.fromdate, r.todate, rs.reservationsourcecode, rs.reservationsourcedescription FROM reservations r JOIN reservationsource rs ON r.idreservationsource = rs.idreservationsource WHERE todate = '" + req.query.departDate + "' AND idreservationstatus = 4";
		console.log(query);
		executeWWQuery(res, query);
})

//GET IN HOUSE RESERVATIONS
app.post("/api/reservationsInHouse", function(req,res){
	var query = "SELECT * FROM reservations r JOIN reservationsource rs ON r.idreservationsource = rs.idreservationsource WHERE idreservationstatus = 4";
	console.log(query);
	executeWWQuery(res, query)
});

//GET SPECIFIC RESERVATION BY RESERVATIONNUM
app.post("/api/getReservation", function(req,res){
	var query = "SELECT r.*, g.* FROM reservations r join reservationsguest rg on r.idreservation = rg.idreservation join guest g on rg.idguest = g.idguest WHERE r.idreservation = " + req.query.reservationId;
	console.log(query);
	executeWWQuery(res,query);
});

app.post("/api/checkIn", function(req,res){
	var query = "UPDATE reservations SET idreservationstatus = 4 WHERE idreservation = " + req.query.reservationNum;
	console.log(query);
	executeWWQuery(res, query);
});

app.post("/api/checkOut", function(req,res){
	var query = "UPDATE reservations SET idreservationstatus = 5 WHERE idreservation = " + req.query.reservationNum;
	console.log(query);
	executeWWQuery(res, query);
});

app.post("/api/cancelReservation", function(req,res){
	var query = "UPDATE reservations SET idreservationstatus = 2 WHERE idreservation = " + req.query.reservationNum;
	console.log(query);
	executeWWQuery(res, query);
});

app.post("/api/cancelAll", function(req,res){
	var query = "UPDATE reservations SET idreservationstatus = 2";
	console.log(query);
	executeWWQuery(res, query);
});
//PUT API

//NEW RESERVATION
app.post("/api/saveReservation", function(req,res){
	query = "EXEC pms..sp_InsertReservation '" + req.query.surname + "','" + req.query.forename + "', '" + req.query.arrivalDate + "','" + req.query.departureDate + "', 1, 1";
	var conn = new sql.ConnectionPool(wwServerConfig);
	conn.connect().then(function(conn){
		var request = new sql.Request(conn);
		//request.input('clientId', sql.Int, req.query.clientId);
		request.input('surname', sql.NVarChar(50), req.query.surname);
		request.input('forename', sql.NVarChar(50), req.query.forename);
		request.input('arrivaldate', sql.NVarChar(50), req.query.arrivalDate);
		request.input('departdate', sql.NVarChar(50), req.query.departureDate);
		request.input('idreservationsource', sql.Int, req.query.bookingSource);
		request.input('idcountry', sql.Int, req.query.idNationality);
		request.input('idunittype', sql.Int, req.query.idUnitType);
		request.input('idratecode', sql.Int, 1);
		request.output('outReservationId', sql.Int);
		request.output('outGuestId', sql.Int);
		request.execute('sp_insertReservationGuest',function(err, recordsets, returnValue, affected){
			console.dir(recordsets);
			res.send(recordsets.output);
		})
		.catch(function(err){
			res.send(err);
			console.log(err);
		});
	})
});

//SAVE RESERVATION
app.put("/api/saveReservation", function(req,res){
	var query = "UPDATE reservations SET surname = '" + req.query.surname + "', forename = '" + req.query.forename + "', reservationName  = '" + req.query.surname + "' WHERE reservationId = " + req.query.reservationId ;
	console.log(query);
	executeQuery(res, req); 
});

//HOUSEKEEPING
	//SET ROOM STATUS TO CLEAN
		//FOR DEV IS CURRENTLY HARCODED TO SET ROOMID 1 TO CLEAN -- NEED TO FIX DYNAMICALLY - NEED AVAILABILITY SP
app.post('/api/cleanRoom',function(req, res){
	var query = "UPDATE units SET idhskstatus = 1 WHERE idunit = " + req.query.roomId;
	console.log(query);
	executeWWQuery(res, query);
})

//ROLL DAY
app.post("/api/rollDay", function(req,res){
	var conn = new sql.ConnectionPool(wwServerConfig);
	conn.connect().then(function(conn){
		var request = new sql.Request(conn);
		request.output('outDate', sql.NVarChar(50));
		request.execute('sp_rollDay', function(err, recordsets, returnValue, affected){
			res.send(recordsets.output);
		})
		.catch(function(err){
			res.send(err);
			console.log(err);
		});
	})
});