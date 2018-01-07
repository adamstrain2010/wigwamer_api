var express = require("express");
var bodyParser = require("body-parser");
var sql = require("mssql");
var sqlSeriate = require("seriate");
var moment = require("moment");
var app = express();


app.use(bodyParser.json());


//CORS MIDDLEWARE 
app.use(function(req,res,next){
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,HEAD, DELETE, OPTIONS,POST,PUT");
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


var wwServerConfig = {
	user: "sa",
	password: "W1gw@m3r!",
	server: "wigwamer.com",
	database: "pms"
};


sqlSeriate.addConnection({
	name: "testConn",
	user: "sa",
	password: "W1gw@m3r!",
	host: "wigwamer.com",
	database: "pms"
});

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
app.get("/api/getSystemOptions", function(req, res){
    var query = "select * from systemoptions WHERE idproperty = '" + req.query.idproperty +"'";
    console.log(query);
    executeWWQuery(res, query);
});


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
    //WHERE idproperty = blabla
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

function getConcurrentRooms(fromDate,toDate,idUnitType){
    return sqlSeriate.execute({
        procedure: "sp_getConcurrentAvailability",
        params: {
            fromDate: {
                type: sqlSeriate.DATE,
                val: fromDate
            },
            toDate: {
                type: sqlSeriate.DATE,
                val: toDate
            },
            idUnitType: {
                type: sqlSeriate.INT,
                val: idUnitType
            }
        }
    })
}

app.get("/api/getConcurrentRooms", async function(req,res) {
    let out;
    out = await getConcurrentRooms(req.query.fromDate, req.query.toDate, req.query.idUnitType);
    console.dir(out);
    res.send(out);
})

app.get("/api/getNonConcurrentRooms", function(req,res) {
    var query = "SELECT *, unitdescription as number FROM units WHERE idunittype = " + req.query.idUnitType + " AND inuse = 'Y'";
	executeWWQuery(res, query);
})

app.get("/api/getDetailedAvailability", async function(req,res){
	let out;
    out = await getDetailedAvailability(req.query.fromDate, req.query.toDate, req.query.idUnitType);
    console.dir(out);
    res.send(out);
})


function getDetailedAvailability(fromdate, todate, idUnitType){
    return sqlSeriate.execute({
        procedure: "sp_getUnitAvailability",
        params: {
            fromDate: {
                type: sqlSeriate.DATE,
                val: fromdate
            },
            toDate: {
                type: sqlSeriate.DATE,
                val: todate
            },
            idunittype: {
                type: sqlSeriate.INT,
                val: idUnitType
            }
        }
    })
}

app.get("/api/getPlannerData", async function(req, res){
    let out;
    out = await getPlannerData(req.query.fromDate, req.query.toDate);
    res.send(out);
})

function getPlannerData(fromDate, toDate){
    return sqlSeriate.execute({
        procedure: "sp_GetPlannerData",
        params: {
            arriving: {
                type: sqlSeriate.DATE,
                val: fromDate
            },
            departing: {
                type: sqlSeriate.DATE,
                val: toDate
            }
        }
    })
}


// function getDetailedAvailability(fromdate, todate, idUnitType){
//     return sqlSeriate.execute({
//         procedure: "sp_getUnitAvailability",
//         params: {
//             fromDate: {
//                 type: sqlSeriate.DATE,
//                 val: fromdate
//             },
//             toDate: {
//                 type: sqlSeriate.DATE,
//                 val: todate
//             },
//             idunittype: {
//                 type: sqlSeriate.INT,
//                 val: idUnitType
//             }
//         }
//     })
// }

app.get("/api/getAllReservations", function(req, res){
	var query = "SELECT * FROM reservations r JOIN reservationstatus rs ON r.idreservationstatus = rs.idreservationstatus WHERE fromdate BETWEEN '" + req.query.arrivalFromDate + "' AND '" + req.query.arrivalToDate + "' AND todate BETWEEN '" + req.query.departureFromDate + "' AND '" + req.query.departureToDate + "'";
	executeWWQuery(res, query);
})

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
	var query = "SELECT re.idreservationextras, re.idextras AS extraId, e.extrasdescription AS extraDesc, e.extrachargetype as extraType, 1 as qty, re.adultCharge as unitPrice, 1 * re.adultCharge as subTotal FROM reservations_extras re JOIN extras e on re.idextras = e.idextras WHERE idreservation = " + req.query.idReservation;
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

app.get("/api/getTransactions", function(req,res){
	var query = "SELECT * FROM transactions WHERE idreservation = " + req.query.reservationId;
	console.log(query);
	executeWWQuery(res, query);
})

app.get("/api/getTransactionCodes", function(req, res){
	var query = "SELECT * FROM transactioncodes WHERE idclient = " + req.query.clientId;
	console.log(query);
	executeWWQuery(res,query);
})

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
            chargedate: {
                type: sqlSeriate.DATE,
                val: chargeDate
            },
            accommodationicltax:{
                type: sqlSeriate.DECIMAL,
                val: accomInclTax
			},
            accommodationexcltax:{
                type: sqlSeriate.DECIMAL,
                val: accomExclTax
			},
            adultcharge:{
                type: sqlSeriate.DECIMAL,
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
			}
		}
    })
}

app.post("/api/deleteExtra",function(req,res){
    var query = "DELETE FROM reservations_extras WHERE idreservationextras = " + req.query.extraId + " AND idreservation = " + req.query.resId;
    executeWWQuery(res,query);
})

function CalcBalanceToPay(idReservation){
    return sqlSeriate.execute({
        procedure: "sp_GetBalanceToPay",
        params: {
            idReservation: {
                type: sqlSeriate.INT,
                val: idReservation
            }
        }
    })
}

app.get("/api/getBalanceToPay",async function(req,res){
	let out;
	out = await CalcBalanceToPay(req.query.reservationId);
	res.send(out);
})

//GET IN HOUSE GUESTLIST
app.get("/api/getInHouseGuests", function(req, res){
	var query = "SELECT r.idreservation, \n" +





        "r.reservationname,\n" +
        "r.fromdate,\n" +
        "r.todate,\n" +
        "r.idreservationsource,\n" +
        "rs.reservationsourcedescription,\n" +
        "rs.reservationsourcecode,\n" +
        "rs.reservationcolour\n" +
        "  FROM reservations r\n" +
        "JOIN unitsbooked ub\n" +
        "ON r.idreservation = ub.idreservation\n" +
        "JOIN reservationsource rs\n" +
        "ON r.idreservationsource = rs.idreservationsource\n" +
        "WHERE ub.bookeddate = '2017-06-07'";
		console.log(query);
		executeWWQuery(res,query);
})



//GET ALL RATE CODES
app.get("/api/getRateCodes", function(req,res){
	var query = "SELECT * FROM ratecodes WHERE idclient = " + req.query.idClient + " AND idproperty = " + req.query.idProperty;
	console.log(query);
	executeWWQuery(res, query);
})


app.get("/api/getHistory", function(req,res){
	var query = "SELECT * FROM reservationlog WHERE idproperty = " + req.query.idproperty + " AND  idreservation = " + req.query.idreservation;
	console.log(query);
	executeWWQuery(res, query);
})

app.post("/api/getCharges", async function(req,res){
	let out;
    out = await GetCharges(req.query.idReservation);
	res.send(out);
})

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

// app.get("/api/getBreakdown", function(res,req){
//    var query = "select idunitsbooked, bookeddate, 'Accommodation' as 'description', ratevalue, 'Accommodation' as type from unitsbooked where idreservation = " + req.query.resId + " UNION ALL select t.idtransaction, null, tc.transactiondescription as 'description', t.valuetransaction, 'trans' as type from transactions t JOIN transactioncodes tc ON t.idtransactioncode = tc.idtransactioncode where idreservation = " + req.query.resId " + UNION ALL select idreservationextras, chargedate,'Other' as 'description', adultcharge, 'extra' as type from reservations_extras where idreservation = " + resId;
//    executeWWQuery(res, query);
// });

app.get("/api/getBreakdown", function(req,res){
    var query = "select idunitsbooked as 'id', bookeddate as 'date', 'Accommodation' as 'description', ratevalue as 'value', 'Accommodation' as chargeType, posted from unitsbooked where idreservation = " + req.query.resId + " UNION ALL select t.idtransaction, t.datetransaction, tc.transactiondescription as 'description', t.valuetransaction, 'Posting' as type, 'Y' from transactions t JOIN transactioncodes tc ON t.idtransactioncode = tc.idtransactioncode where idreservation = " + req.query.resId  + "and idtransactiongroup NOT IN (1,5) UNION ALL select t.idtransaction, t.datetransaction, tc.transactiondescription as 'description', t.valuetransaction, 'Payment' as type, 'Y' from transactions t JOIN transactioncodes tc ON t.idtransactioncode = tc.idtransactioncode where idreservation = " + req.query.resId + " and idtransactiongroup = 5 UNION ALL select re.idreservationextras, re.chargedate ,e.extrasdescription as 'description', re.adultcharge, 'Extra' as type , 'Y' from reservations_extras re join extras e ON re.idextras = e.idextras where idreservation = " + req.query.resId;
    executeWWQuery(res, query);
})

function voidTransaction(transactionId){
    return sqlSeriate.execute({
        query: "UPDATE transactions SET void = 1 WHERE idtransaction = @idTransaction",
        params:{
            idTransaction:{
                type: sqlSeriate.INT,
                val: transactionId
            }
        }
    })
}

app.post("/api/logChange", function(req,res){
    var query = "INSERT INTO reservationlog (insertdate, idproperty, idclient, idreservation, type, oldvalue, newvalue, iduser) VALUES ('2017-01-01', 1,1,100,'MADE','','2017-06-01', 1)";
    executeWWQuery(req, query);
})


// app.post("/api/logChange", function(req,res){
//     var query = "INSERT INTO reservationlog (insertdate, idproperty, idclient, idreservation, type, oldvalue, newvalue, iduser) VALUES ('" + req.query.insertDate + "'," + req.query.idProperty + ", " + req.query.idClient + ", " + req.query.resId + ", '" + req.query.detail + "', '" + req.query.from + "', '" + req.query.to + "', " + req.query.idUser + ")";
//     //res.send(query);
//     executeWWQuery(res, query);
// })

app.post("/api/insertExtra", async function(req,res) {
    let out;
    console.log("CLIENT ID:");
    console.log(req.query.clientId)
    console.log("");
    out = await InsertExtra(req.query.clientId, req.query.propertyId,
		req.query.extraId, req.query.reservationId, req.query.chargeDate, req.query.accomIncltax, req.query.accomExclTax,req.query.adultCharge,req.query.childCharge,req.query.infantCharge, req.query.fixedCharge, req.query.totalflatcharge)
	console.dir(out);
    res.send(out);
})

function insertPosting(idClient, idProperty, userId, reservationIdIN, transcodeIdIN, valueIN, taxIn, sysDate){
    var d = moment.utc().local().format("L LT");
	console.log(d);
    sqlSeriate.getPlainContext("testConn")
	.step("insertPosting",{
		//query: "INSERT INTO transactions (idclient, idproperty,idreservation, iduser, idtransactioncode, valuetransaction, datetransaction, valuetax, idoriginalreservation, systemdatetransaction) VALUES (@idClient, @idProperty, @reservationId,@userId, @transCodeId, @val, @transDate,@valueTax, @reservationId, '1900-01-01')",
		query: "INSERT INTO transactions (idclient, idproperty,idreservation, iduser, idtransactioncode, valuetransaction, datetransaction, valuetax, idoriginalreservation, systemdatetransaction) VALUES (@idClient, @idPropery, @reservationId,@userId, @transCodeId, @val, @transDate,@valueTax, @reservationId, '1900-01-01')",
		params: {
			idClient:{
                type: sqlSeriate.INT,
                val: idClient,
            },
            idPropery:{
                type: sqlSeriate.INT,
                val: idProperty,
            },
		    reservationId: {
				type: sqlSeriate.INT,
				val: reservationIdIN,
			},
            userId: {
			    type: sqlSeriate.INT,
                val: userId
            },
			transCodeId: {
				type: sqlSeriate.INT,
				val: transcodeIdIN,
			},
			val: {
				type: sqlSeriate.MONEY,
				val: valueIN,
			},
			transDate:{
				type: sqlSeriate.NVARCHAR,
				val: sysDate,
			},
			valueTax:{
				type: sqlSeriate.MONEY,
				val: taxIn,
			}
		}
	})
	.end(function(sets){
		return sets;
	})
	.error(function(err){
		console.log(err);
	})
};



app.get("/api/insertPosting",async function(req,res){
	console.log(req.query.value);
	let out;
	out = await insertPosting(1,1,1,req.query.reservationId, req.query.transcodeId, req.query.value, req.query.tax, req.query.sysDate);
	res.send(out);
});

app.get("/api/getPostings", function(req,res){
	var query = "select t.idtransaction, t.void,t.datetransaction as datetransaction, tc.transactiondescription as transactiondescription,t.valuetransaction as valuetransaction\n" +
        "from transactions t\n" +
        "join transactioncodes tc\n" +
        "on t.idtransactioncode = tc.idtransactioncode\n" +
        "where t.idreservation = " + req.query.reservationId + " ORDER BY t.datetransaction";
	console.log(query);
	executeWWQuery(res, query);
})


app.get("/api/getHKUnits", function(req,res){
    var query = "Select u.idunit, u.idunittype, ut.unittypedesc, u.unitnumber, u.idunitstatus, u.idhskstatus, r.idreservation, r.reservationname, r.fromdate, r.todate, us.unitstatusdesc, hs.hskstatusdesc, r2.idreservation as residreservation, r2.reservationname as resreservationname, r2.fromdate as resfromdate, r2.todate as restodate from units u JOIN unitstatus us ON u.idunitstatus = us.idunitstatus JOIN hskstatus hs ON u.idhskstatus =hs.idhskstatus JOIN unittype ut ON u.idunittype = ut.idunittype left outer join unitsoccupied uo on (u.idunit = uo.idunit) left outer join reservations r on (uo.idreservation = r.idreservation) left outer join unitsbooked ub on (u.idunit = ub.idunit and ub.bookeddate = (select systemdate from systemdates)) left outer join reservations r2 on (ub.idreservation = r2.idreservation and r2.idreservationstatus = 1) where u.inuse = 'y'";
    console.log(query);
    executeWWQuery(res, query);
})


//GET ALL SPECIALS
app.get("/api/getAllSpecials", function(req, res){
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
	//GET RESERVATIONS BY ARRIVALDATE
function getReservationsByArrivalDate(arrivaldate, inhousedate, idUnitType){
	console.log(idUnitType);
	console.log(arrivaldate);
	console.log(inhousedate);
	return sqlSeriate.execute({
		procedure: "sp_GetReservationsWithBalances",
		params:{
			arrivaldate: {
				type: sqlSeriate.DATE,
				val: arrivaldate
			},
			inhousedate:{
				type: sqlSeriate.DATE,
				val: inhousedate
			},
			idunittype: {
				type: sqlSeriate.INT,
				val: idUnitType
			}
		}
	})
}

function autoAllocateRooms(reservationarray){
	return sqlSeriate.execute({
		procedure: "sp_AutoAllocate",
		params:{
			reservationArray: {
				type: sqlSeriate.NVARCHAR,
				val: reservationarray
			}
		}
	})
}

function voidTransaction(transactionId){
	return sqlSeriate.execute({
		query: "UPDATE transactions SET void = 1 WHERE idtransaction = @idTransaction",
		params:{
			idTransaction:{
				type: sqlSeriate.INT,
				val: transactionId
			}
		}
	})
}

app.post("/api/voidTransaction", async function(req,res){
	let out;
	out = await voidTransaction(req.query.transId);
	res.send(out);
})

app.post("/api/allocateRoom", async function(req,res){
	let out;
	out = await allocateRooms(req.query.idReservation, req.query.idUnit);
	res.send(out);
})

app.post("/api/deallocateRoom", async function(req,res){
    let out;
    out = await deallocateRooms(req.query.idReservation);
    res.send(out);
})

app.post("/api/autoAllocate", async function(req, res){
	let out;
	out = await autoAllocateRooms(req.query.reservations);
	res.send(out);
})

app.post("/api/testytest", function(req, res){
	res.send(req.idReservation);
})

app.post("/api/getReservationsFull", async function(req, res){
    let out;
    out = await getReservationsFull(req.query.arrivalFromDate, req.query.arrivalToDate, req.query.departureFromDate, req.query.departureToDate);
    res.send(out);
})

function getReservationsFull(arrivalFrom, arrivalTo, departureFrom, departureTo){
    return sqlSeriate.execute({
        procedure: "sp_GetReservationsWithBalancesFull",
        params:{
            arrivalfromdate: {
                type: sqlSeriate.DATE,
                val: arrivalFrom
            },
            arrivaltodate: {
                type: sqlSeriate.DATE,
                val: arrivalTo
            },
            departurefromdate: {
                type: sqlSeriate.DATE,
                val: departureFrom
            },
            departuretodate: {
                type: sqlSeriate.DATE,
                val: departureTo
            }
        }
    })
}

function allocateRooms(idReservation, idUnit){
    return sqlSeriate.execute({
        query: "UPDATE unitsbooked SET idunit = @idunit WHERE idreservation = @idreservation",
        params:{
            idunit:{
                type: sqlSeriate.INT,
                val: idUnit
            },
			idreservation:{
            	type: sqlSeriate.INT,
				val: idReservation
			}
        }
    })
}

function deallocateRooms(idReservation){
    return sqlSeriate.execute({
        query: "UPDATE unitsbooked SET idunit = null WHERE idreservation = @idreservation",
        params:{
            idreservation:{
                type: sqlSeriate.INT,
                val: idReservation
            }
        }
    })
}

app.post("/api/reservations", async function(req,res){
    let out;
    out = await getReservationsByArrivalDate(req.query.arrivalDate, req.query.inHouseDate, req.query.idUnitType);
    res.send(out);
	// var query = "SELECT r.idreservation, r.reservationname, r.fromdate, r.todate, rs.reservationsourcecode,rs.reservationcolour,rs.reservationsourcedescription FROM reservations r JOIN reservationsource rs ON r.idreservationsource = rs.idreservationsource WHERE fromdate = '" + req.query.arrivalDate + "' AND idreservationstatus = 1";
        // console.log(query);
		// executeWWQuery(res,query);

});






//FOR DEV TURN ALL RESERVATIONS TO RESERVATION STATUS
app.post("/api/changeAllToReservation", function(req,res){
        var query = "UPDATE reservations SET idreservationstatus = 1"; 
        console.log(query);
		executeWWQuery(res,query);
});

//GET DEPARTING RESERVATIONS
app.post("/api/reservationsByDepartDate",async function(req,res){
    let out;
    out = await getReservationsByDepartDate(req.query.departDate);
    res.send(out);
    // var query = "SELECT r.idreservation, r.reservationname, r.fromdate, r.todate, rs.reservationsourcecode, rs.reservationsourcedescription FROM reservations r JOIN reservationsource rs ON r.idreservationsource = rs.idreservationsource WHERE todate = '" + req.query.departDate + "' AND idreservationstatus = 7";
		// console.log(query);
		// executeWWQuery(res, query);
})

function getReservationsByDepartDate(departDate){
    return sqlSeriate.execute({
        procedure: 'sp_GetReservationsDepartingWithBalances',
        params: {
            departuredate: {
                type: sqlSeriate.DATE,
                val: departDate
            },
        }

    })
}

app.post("/api/reservationsByDepartDate",async function(req,res){
    let out;
    out = await getReservationsByDepartDate(req.query.departDate);
    res.send(out);
    // var query = "SELECT r.idreservation, r.reservationname, r.fromdate, r.todate, rs.reservationsourcecode, rs.reservationsourcedescription FROM reservations r JOIN reservationsource rs ON r.idreservationsource = rs.idreservationsource WHERE todate = '" + req.query.departDate + "' AND idreservationstatus = 7";
    // console.log(query);
    // executeWWQuery(res, query);
})

function getReservationsByDepartDate(departDate){
    return sqlSeriate.execute({
        procedure: 'sp_GetReservationsDepartingWithBalances',
        params: {
            departuredate: {
                type: sqlSeriate.DATE,
                val: departDate
            },
        }

    })
}

//GET IN HOUSE RESERVATIONS
app.post("/api/reservationsInHouse",async function(req,res) {
    let out;
    out = await getReservationsInHouse(req.query.departDate);
    res.send(out);
});

function getReservationsInHouse(){
    return sqlSeriate.execute({
        procedure: 'sp_GetReservationsInHouseWithBalances'
    })
}

//GET SPECIFIC RESERVATION BY RESERVATIONNUM
app.post("/api/getReservation", function(req,res){
	var query = "SELECT TOP 1 r.*,g.*,ub.idunittype, ub.idunit, u.unitdescription, ub.idratecode, ut.unittypedesc FROM reservations r join reservationsguest rg on r.idreservation = rg.idreservation join guest g on rg.idguest = g.idguest JOIN unitsbooked ub ON r.idreservation = ub.idreservation JOIN unittype ut ON ub.idunittype = ut.idunittype LEFT JOIN units u ON ub.idunit = u.idunit JOIN ratecodes rc ON ub.idratecode = rc.idratecode WHERE r.idreservation = " + req.query.reservationId;
	console.log(query);
	executeWWQuery(res,query);
});

app.post("/api/checkIn", function(req,res){
	var query = "UPDATE reservations SET idreservationstatus = 7 WHERE idreservation = " + req.query.reservationNum + "; INSERT INTO unitsoccupied (idreservation, idunit) VALUES (" + req.query.reservationNum + "," + req.query.idUnit + "); UPDATE units SET idunitstatus = 2, idhskstatus = 1 WHERE idunit = " + req.query.idUnit;
	console.log(query);
	executeWWQuery(res, query);
});

app.post("/api/checkOut", function(req,res){
	var query = "UPDATE reservations SET idreservationstatus = 8 WHERE idreservation = " + req.query.reservationNum + ";DELETE FROM unitsoccupied WHERE idreservation = " + req.query.reservationNum + "; UPDATE units SET idunitstatus = 1";
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
		request.input('idunit', sql.Int, req.query.idUnit);
		request.input('idratecode', sql.Int, 1);
		request.output('outReservationId', sql.Int);
		request.output('outGuestId', sql.Int);
		request.execute('sp_insertReservationGuest',function(err, recordsets, returnValue, affected){
			console.dir(recordsets);
			res.send(recordsets.output);
		})
		.catch(function(err){
			//res.send(err);
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

app.post("/api/updateRes", async function(req,res){
    let out;
    out = updateRes(req.query.resId, req.query.forename,req.query.arriving,req.query.departing,req.query.unitTypeId,req.query.unitId, req.query.rateCodeId);
    res.send(out);
})

function updateRes(reservationNumber,forename,arriving,departing,unitTypeId, unitId,rateCodeId){
    return sqlSeriate.execute({
        procedure: "sp_updateRes",
        params: {
            idReservation: {
                type: sqlSeriate.INT,
                val: reservationNumber
            },
            newForename: {
                type: sqlSeriate.VARCHAR,
                val: forename
            },
            newArrivalDate: {
                type: sqlSeriate.DATE,
                val: arriving
            },
            newDepartureDate: {
                type: sqlSeriate.DATE,
                val: departing
            },
            newUnitType: {
                type: sqlSeriate.INT,
                val: unitTypeId
            },
            newUnit: {
                type: sqlSeriate.INT,
                val: unitId
            },
            newRateCode: {
                type: sqlSeriate.INT,
                val: rateCodeId
            }
        }
    })
}




//HOUSEKEEPING
	//SET ROOM STATUS TO CLEAN
		//FOR DEV IS CURRENTLY HARCODED TO SET ROOMID 1 TO CLEAN -- NEED TO FIX DYNAMICALLY - NEED AVAILABILITY SP
app.post('/api/cleanRoom',function(req, res){
	var query = "UPDATE units SET idhskstatus = " + req.query.statusId + " WHERE idunit = " + req.query.roomId;
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


//DELETE API
app.delete("/api/deleteExtra", function(req, res){
	var query = "DELETE FROM reservations_extras WHERE idreservationextras = " + req.query.idReservationExtra;
	console.log(query);
	executeWWQuery(res, query);
})

