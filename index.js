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

app.get('/signup', function (req, res) {
    res.sendFile(__dirname + "/" + "signup.html");
})

app.get('/verify', function (req, res) {
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

app.post('/adduser', urlencodedParser, function (req, res) {
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
                .then(function (response) {

                }).catch(function (error) {

                });
            res.status(200).send({
                status: "OK"
            });
        }
    });
})

app.post('/verify', function (req, res) {
    var email = req.body.email;
    var key = req.body.key;

    db.verify(email, key, (err, result) => {
        if (result == 1) {
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

app.post('/login', function (req, res) {
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

app.post('/logout', function (req, res) {
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

app.post('/additem', function (req, res) {
    //var tweet = req.body.content;
    //var childType = req.body.childType;
    if (!req.session.loggedin) {
        res.status(500).send({
            status: "error",
            id: "",
            error: "error"
        });
    }
    else {
        let id = Math.floor((Math.random() * 1000000000) + 1);
        console.log(req.body);
        let tweet = {
            id: id,
            username: req.session.username,
            originalUsername: "null",
            content: req.body.content,
            parent: 0,
            childType: "null",
            media: "null"
        };
        console.log(tweet);
        db.addTweet(tweet, (err, result) => {
            if (err) {
                res.status(500).send({
                    status: "error",
                    id: id,
                    error: "error"
                });
            }
            else if (result == 1) {
                res.status(200).send({
                    status: "OK",
                    id: id,
                    error: ""
                });
            }
            else {
                res.status(500).send({
                    status: "error",
                    id: id,
                    error: "error"
                });
            }
        })
    }
})

app.get('/item/:id', function (req, res) {
    let id = parseInt(req.params.id);
    console.log(id);
    db.getTweet(id, (err, result) => {
        if (err) {
            res.status(500).send({
                status: "error",
                error: err
            });
        } else {
            res.status(200).send({
                status: "OK",
                item: result,
                error: null
            })
        }
    })
})

app.post('/search', function (req, res) {
    console.log(req.body);
    let timestamp = Math.floor((new Date()).getTime() / 1000);
    if (req.body.timestamp){
        timestamp = Math.floor(req.body.timestamp);
    }
    let limit = 25;
    if (req.body.limit && req.body.limit <= 100 && req.body.limit > 0) {
        limit = req.body.limit;
    }
    db.search(timestamp, limit, (err, result) => {
        if (err) {
            res.status(500).send({
                status: "error",
                error: err
            });
        } else {
            res.status(200).send({
                status: "OK",
                error: null,
                items: result
            })
        }
    })
})


app.post('/getscore', function (req, res) {
    db.getScore(req.session.username, (err, result) => {
        if (err) {
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
