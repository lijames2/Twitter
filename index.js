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

app.get('/', function (req, res) {
    if (req.session.loggedin) {
        res.redirect('/logout');
    } else {
        res.sendFile(__dirname + "/" + "index.html");
    }
})

// app.get('/login', function(req, res) {
//     res.sendFile(__dirname + "/" + "index.html");
// })

app.get('/signup', function(req, res) {
    res.sendFile(__dirname + "/" + "signup.html");
})

app.get('/verify', function(req, res) {
    res.sendFile(__dirname + "/" + "verify.html");
})

app.get('/logout', function (req, res) {
    if (!req.session.loggedin) {
        res.redirect('/ttt');
    } else {
        res.sendFile(__dirname + "/" + "logout.html");
    }
})

// app.post('/ttt', urlencodedParser, function (req, res) {
//     response = {
//         name: req.body.name
//     };
//     var fileContent = fs.readFileSync(__dirname + "/" + "grid.html", 'utf8');
//     var today = new Date();
//     var dd = String(today.getDate()).padStart(2, '0');
//     var mm = String(today.getMonth() + 1).padStart(2, '0');
//     var yyyy = today.getFullYear();
//     today = mm + '/' + dd + '/' + yyyy;

//     fileContent = fileContent.replace("<h2 id='name'>Test</h2>", "<h2 id='name'>Welcome: " + response.name + ", today is " + today + "!</h2>")
//     res.write(fileContent);
//     res.end();
// })

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
                status : "OK",
                error: ""
            });
        }
        else {
            res.status(500).send({
                status: "error",
                error: "error"
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
                status: "OK",
                error: ""
            });    
        }
        else {
            res.status(500).send({
                status: "error",
                error: "error"
            });
        }
     });
 })

 app.post('/logout', function(req, res) {
    if (req.session.loggedin) {
        res.clearCookie('user_sid');    
        res.status(200).send({
            status: "OK",
            error: ""
        });   
    } else {
        res.status(500).send({
            status: "error",
            error: "error"
        });
    }
 })

app.post('/additem', function(req,res) {
    //var tweet = req.body.content;
    //var childType = req.body.childType;
    console.log(req.body);
    tweet = {
        username = req.session.username,
        originalUsername = req.body.originalUsername,
        content = req.body.content,
        parent = req.body.parent,
        childType = req.body.childType,
        media = req.body.media
    };
    db.addTweet(tweet, (err, result) => {
        if (result == 1) {
            res.status(200).send({
                status : "OK",
                id: "",
                error: ""
            });
        }
        else {
            res.status(500).send({
                status: "error",
                id: "",
                error: "error"
            });
        }
    })
})

 app.post('/listgames', function(req, res) {
    db.getAllGames(req.session.username, (err, result) => {
        if (err) {
            res.status(500).send({
                status: "OK",
                error: ""
            });
        } else {
            res.status(200).send({
                status: "OK",
                error: ""
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

var server = app.listen(80, function () {
    var host = server.address().address
    var port = server.address().port

    console.log("Example app listening at http://%s:%s", host, port)
})
