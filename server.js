var express = require('express');
var bodyParser = require('body-parser');
var _ = require('underscore');
var bcrypt = require('bcryptjs');
var app = express();
var db = require('./db.js');
var PORT = process.env.PORT || 3000;
var middleware = require('./middleware.js')(db);
var request = require('request');
app.use(bodyParser.json());



app.use(express.static(__dirname + '/public'));

app.get('/users', middleware.requireAuthentication,  function(req, res) {
	console.log("here");
});


app.post('/games', function(req, res){
	request.get('http://www.nfl.com/liveupdate/scorestrip/ss.json', function(err, res, body){
		body = JSON.parse(body)
		week = body.w;

		games = body.gms;

		games.forEach(function(game){
			var sanitizeGame = _.pick(game, 'hs', 'd', 'gsis', 'vs', 'eid', 'h', 'v', 'vnn', 't', 'q', 'hnn');
			
			var gameInfo = {
				gameID: sanitizeGame.gsis,
				homeTeamName: sanitizeGame.hnn,
				homeTeamCityAbbr: sanitizeGame.h,
				homeScore: sanitizeGame.hs,
				awayTeamName: sanitizeGame.vnn,
				awayTeamCityAbbr: sanitizeGame.v,
				awayScore: sanitizeGame.vs,
				dayOfWeek: sanitizeGame.d,
				time: sanitizeGame.t,
				gameDate: sanitizeGame.eid,
				quarter: sanitizeGame.q,
				week: week,
			}
			db.games.create(gameInfo);
		})

	});
});

//post user
app.post('/users', function(req,res){
	var body = _.pick(req.body, 'first', 'last', 'email', 'password', 'teamName');
	db.user.create(body)
		.then(function(user) {
			res.json(user.toPublicJSON());
		})
		.catch(function(e) {
			console.log(e);
			res.status(400).json(e);
		});
});

//POST /users/login
app.post('/users/login', function(req, res) {
	var body = _.pick(req.body, 'email', 'password');
	var userInstance;

	db.user.authenticate(body)
		.then(function(user) {

			var token = user.generateToken('authentication');
			userInstance = user;
			return db.token.create({
					token: token
				})
				.then(function(tokenInstance) {
					if (token) {
						res.header('Auth', tokenInstance.get('token')).json(userInstance.toPublicJSON());
					} else {
						res.status(401).send();
					}
				})
		})
		.catch(function(e) {
			res.status(401).send();
		});
});

//DELETE Token- logout
// DELETE users/login
app.delete('/users/login', middleware.requireAuthentication, function(req, res){
	req.token.destroy()
	.then(function(){
		res.status(204).send();
	}).
	catch(function(e){
		res.status(500).send();
	});
});



db.sequelize.sync({
		force:true
	})
	.then(
		app.listen(PORT, function() {
			console.log('express listening on port ' + PORT + '!');
		})
	);