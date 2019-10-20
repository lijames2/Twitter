var express = require('express');
var fs = require("fs");
var app = express();
var session = require('express-session');
var bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
var path = require('path');
var urlencodedParser = bodyParser.urlencoded({ extended: true })
const db = require('./db.js');
const nodemailer = require('nodemailer');

app.use(session({
    key: 'user_sid',
    secret: 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: 600000
    }
}));
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/ttt', function (req, res) {
    if (req.session.loggedin) {
        res.redirect('/logout');
    } else {
        res.sendFile(__dirname + "/" + "index.html");
    }
})

app.get('/logout', function (req, res) {
    if (!req.session.loggedin) {
        res.redirect('/ttt');
    } else {
        res.sendFile(__dirname + "/" + "logout.html");
    }
})

app.post('/ttt', urlencodedParser, function (req, res) {
    response = {
        name: req.body.name
    };
    var fileContent = fs.readFileSync(__dirname + "/" + "grid.html", 'utf8');
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0');
    var yyyy = today.getFullYear();
    today = mm + '/' + dd + '/' + yyyy;

    fileContent = fileContent.replace("<h2 id='name'>Test</h2>", "<h2 id='name'>Welcome: " + response.name + ", today is " + today + "!</h2>")
    res.write(fileContent);
    res.end();
})

 app.post('/adduser', urlencodedParser, function(req, res) {
    var username = req.body.username;
    var password = req.body.password;
    var email = req.body.email;
    var key = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    db.addUser(username, password, email, key, (err, result) => {
        if (err) {
            res.status(400).send({
                success: false
            });
        }
        else {
            //SEND EMAIL
            let transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'cloud356ttt@gmail.com',
                    pass: 'cse356-cloud',
                }
            });
            
            let mailOptions = {
                from: 'cloud356ttt@gmail.com',
                to: email,
                subject: 'Verify your email.',
                text: 'validation key: ' + '<' + key + '>',
            };
            
            transporter.sendMail(mailOptions)
                .then(function(response) {

                }).catch(function(error) {

                });
            res.status(200).send({
                status: "OK"
            });
        }
    });
 })

 app.post('/verify', function(req, res) {
    var email = req.body.email;
    var key = req.body.key;

    db.verify(email, key, (err, result) => {
        if (result == 1) {
            res.status(200).send({
                status: "OK"
            });
        }
        else {
            res.status(500).send({
                error: "ERROR"
            });
        }
    });
 })

 app.post('/login', function(req, res) {
     var username = req.body.username;
     var password = req.body.password;

     db.login(username, password, (err, result) => {
        if (err) {
            res.status(400).send({
                success: false
            });
        }
        else if (result == 1) {   
            req.session.loggedin = true;
            req.session.username = username;
            res.status(200).send({
                status: "OK"
            });    
        }
        else {
            res.status(500).send({
                error: "ERROR"
            });
        }
     });
 })

 app.post('/logout', function(req, res) {
    if (req.session.loggedin) {
        res.clearCookie('user_sid');    
        res.status(200).send({
            status: "OK"
        });   
    } else {
        res.status(500).send({
            error: "ERROR"
        });
    }
 })

 app.post('/listgames', function(req, res) {
    db.getAllGames(req.session.username, (err, result) => {
        if (err) {
            res.status(500).send({
                error: "ERROR"
            });
        } else {
            res.status(200).send({
                status: "OK",
                games: result
            })
        }
    })
 })

 app.post('/getgame', function(req, res) {
    var id = req.body.id;
    db.getGamesById(id, (err, result) => {
        if(err) {
            res.status(500).send({
                error: "ERROR"
            });
        } else {
            res.status(200).send({
                status: "OK",
                grid: result.grid,
                winner: result.winner
            })
        }
    })
 }) 

 app.post('/getscore', function(req, res) {
    db.getScore(req.session.username, (err, result) => {
        if(err) {
            res.status(500).send({
                error: "ERROR"
            });
        } else {
            res.status(200).send({
                status: "OK",
                human: result.human,
                wopr: result.wopr,
                tie: result.tie
            })
        }
    })
 });

 app.post('/ttt/play', function(req, res) {
     console.log(req.body.move);
     console.log(req.session.game_id);
     console.log(req.session.grid);
    var grid = req.body.grid;
    var user = req.session.username;
    var winner = null;
    if(req.body.move !== null || req.body.move !== undefined) {
        console.log("PING");
        if(req.session.game_id === undefined) {
            grid = [' ',' ',' ',' ',' ',' ',' ',' ',' '];
            grid[req.body.move] = 'X';
        } else {
            grid = req.session.grid;
            grid[req.body.move] = 'X';
        }
    }
    
    if (req.body.move === null) {
        var response = {
            grid: req.session.grid,
            winner: req.session.winner
        }
        res.send(response);
    } else {
        
        if ('X' == grid[0] && 'X' == grid[1] && 'X' == grid[2]) {
            winner = 'X';
        } else if ('X' == grid[3] && 'X' == grid[4] && 'X' == grid[5]) {
            winner = 'X';
        } else if ('X' == grid[6] && 'X' == grid[7] && 'X' == grid[8]) {
            winner = 'X';
        } else if ('X' == grid[0] && 'X' == grid[3] && 'X' == grid[6]) {
            winner = 'X';
        } else if ('X' == grid[1] && 'X' == grid[4] && 'X' == grid[7]) {
            winner = 'X';
        } else if ('X' == grid[2] && 'X' == grid[5] && 'X' == grid[8]) {
            winner = 'X';
        } else if ('X' == grid[0] && 'X' == grid[4] && 'X' == grid[8]) {
            winner = 'X';
        } else if ('X' == grid[2] && 'X' == grid[4] && 'X' == grid[6]) {
            winner = 'X';
        } else {
            // DO RANDOM MOVE
            if(grid.filter(x => x == ' ').length != 0) {
                var dict = [];
                for(var i = 0; i < grid.length; i++) {
                    dict.push({index: i, val: grid[i]});
                }
                dict = dict.filter(x => x.val == ' ');
                grid[dict[Math.floor(Math.random() * dict.length)].index] = 'O';
            }

            if ('O' == grid[0] && 'O' == grid[1] && 'O' == grid[2]) {
                winner = 'O';
            } else if ('O' == grid[3] && 'O' == grid[4] && 'O' == grid[5]) {
                winner = 'O';
            } else if ('O' == grid[6] && 'O' == grid[7] && 'O' == grid[8]) {
                winner = 'O';
            } else if ('O' == grid[0] && 'O' == grid[3] && 'O' == grid[6]) {
                winner = 'O';
            } else if ('O' == grid[1] && 'O' == grid[4] && 'O' == grid[7]) {
                winner = 'O';
            } else if ('O' == grid[2] && 'O' == grid[5] && 'O' == grid[8]) {
                winner = 'O';
            } else if ('O' == grid[0] && 'O' == grid[4] && 'O' == grid[8]) {
                winner = 'O';
            } else if ('O' == grid[2] && 'O' == grid[4] && 'O' == grid[6]) {
                winner = 'O';
            }
        }
        var response = {
            grid: grid,
            winner: winner
        }
        req.session.grid = grid;
        req.session.winner = winner;
        //GAME START
        if(req.session.game_id === undefined) {
            console.log("ADDING NEW GAME");
            var today = new Date();
            var dd = String(today.getDate()).padStart(2, '0');
            var mm = String(today.getMonth() + 1).padStart(2, '0');
            var yyyy = today.getFullYear();
            today = mm + '/' + dd + '/' + yyyy;
            db.addGame(user, today, grid, winner, (err, result) => {
                if (err) {
                    res.status(500).send({
                        error: "ERROR"
                    });
                } else {
                    req.session.game_id = result.id;
                    res.send(response);
                }
            });
        } else {
            console.log("UPDATING GAME");
            console.log(grid);
            db.updateGame(req.session.game_id, grid, winner, (err, result) => {
                if(err) {
                    res.status(500).send({
                        error: "ERROR"
                    });
                } else {
                    if(winner === 'X' || winner === 'O' || grid.filter(x => x === " ").length == 0) {
                        // RESET GAME
                        console.log("RESETTING GAME");
                        req.session.game_id = undefined
                        req.session.grid = null;
                        req.session.winner = null;
                    }
                    console.log(response);
                    res.send(response);
                }
            })
        }
    }
})



var server = app.listen(80, function () {
    var host = server.address().address
    var port = server.address().port

    console.log("Example app listening at http://%s:%s", host, port)
})
