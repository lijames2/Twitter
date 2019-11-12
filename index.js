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
var cookieParser = require('cookie-parser');

app.use(cookieParser());

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
    res.sendFile(__dirname + "/" + "twitter.html");
})

app.get('/current', function (req, res) {
    var info = {};
    if (req.session.loggedin) {
        info.loggedin = true;
        info.username = req.session.username;
    } else {
        info.loggedin = false;
    }
    res.send(info);
}) 

app.get('/login', function (req, res) {
    res.sendFile(__dirname + "/" + "index.html");
})

app.get('/signup', function (req, res) {
    res.sendFile(__dirname + "/" + "signup.html");
})

app.get('/verify', function (req, res) {
    res.sendFile(__dirname + "/" + "verify.html");
})

app.get('/logout', function (req, res) {
    if (!req.session.loggedin) {
        res.redirect('/');
    } else {
        res.sendFile(__dirname + "/" + "twitter.html");
    }
})

app.post('/adduser', urlencodedParser, function (req, res) {
    var username = req.body.username;
    var password = req.body.password;
    var email = req.body.email;
    var key = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    db.addUser(username, password, email, key, (err, result) => {
        if (err) {
            res.status(500).send({
                status: "error",
                error: err
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
            // res.status(200).send({
            //     status: "OK",
            //     error: null
            // });
            res.status(200);
            res.redirect('/');
        }
    });
})

app.post('/verify', function (req, res) {
    var email = req.body.email;
    var key = req.body.key;

    db.verify(email, key, (err, result) => {
        if (result == 1) {
            // res.status(200).send({
            //     status: "OK",
            //     error: null
            // });
            res.status(200);
            res.redirect('/');
        }
        else {
            res.status(500).send({
                status: "error",
                error: err
            });
        }
    });
})
//API
app.post('/login', function (req, res) {
    var username = req.body.username;
    var password = req.body.password;
    console.log(req.body);
    console.log('login request: username:' + username + password);
    db.login(username, password, (err, result) => {
        if (err) {
            res.status(500).send({
                success: false
            });
        }
        else if (result == 1) {
            req.session.loggedin = true;
            req.session.username = username;
            res.status(200).send({
                status: "OK",
                error: null
            });
        }
        else {
            res.status(500).send({
                status: "error",
                error: err
            });
        }
    });
})

app.post('/logout', function (req, res) {
    if (req.session.loggedin) {
        res.clearCookie('user_sid');
        // res.status(200).send({
        //     status: "OK",
        //     error: null
        // });
        res.status(200);
        res.redirect('/');
    } else {
        res.status(500).send({
            status: "error",
            error: err
        });
    }
})

app.post('/additem', function (req, res) {
    if (!req.session.loggedin) {
        res.status(500).send({
            status: "error",
            id: "",
            error: err
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
                    error: err
                });
            }
            else if (result == 1) {
                // res.status(200).send({
                //     status: "OK",
                //     id: id,
                //     error: null
                // });
                res.status(200);
                res.redirect('/logout');
            }
            else {
                res.status(500).send({
                    status: "error",
                    id: id,
                    error: err
                });
            }
        })
    }
})

app.get('/item/:id', function (req, res) {
    let id = parseInt(req.params.id);
    console.log(`Getting item ${id}`);
    db.getTweet(id, (err, result) => {
        if (err) {
            res.status(500).send({
                status: "error",
                error: err
            });
        } else {
            if (result) {
                res.status(200).send({
                    status: "OK",
                    item: result,
                    error: null
                })
            } else {
                res.status(500).send({
                    status: "error",
                    error: err
                });
            }
        }
    })
})

app.delete('/item/:id', function (req, res) {
    let id = parseInt(req.params.id);
    console.log(`Deleting item ${id}`);
    if (req.session.loggedin) {
        db.getTweet(id, (err, result) => {
            if (err) {
                res.status(500).send({
                    status: "error",
                    error: err
                });
            } else if (result.username != req.session.username) {
                res.status(500).send({
                    status: "error",
                    error: err
                });
            } else {
                db.deleteTweet(id, (err, result) => {
                    if (err) {
                        res.status(500).send({
                            status: "error",
                            error: err
                        });
                    } else {
                        res.status(200).send({
                            status: "OK",
                            error: null
                        });
                    }
                });
            }
        });
    } else {
        res.status(500).send({
            status: "error",
            error: "Not logged in"
        });
    }
})

app.post('/search', function (req, res) {
    //console.log(req.body);
    let timestamp = Math.floor((new Date()).getTime() / 1000);
    if (req.body.timestamp) {
        timestamp = Math.floor(req.body.timestamp);
    }
    let limit = 25;
    if (req.body.limit) {
        limit = req.body.limit;
        if (req.body.limit > 100 || req.body.limit < 0) {
            limit = 100;
        }
    }
    //console.log(limit);
    if (req.session.loggedin && (typeof req.body.following === 'undefined' || req.body.following)) {
        following = true;
        console.log('a')
        //Get following usernames
        followingNames = [];
        db.getFollowing(req.session.username, 99999, (err, users) => {
            if (err) {
                res.status(500).send({
                    status: "error",
                    error: err
                });
            } else {
                users.forEach(user => {
                    followingNames.push(user.User);
                });
                console.log(followingNames)
                db.search(timestamp, limit, req.body.q, req.body.username, following, followingNames, (err, result) => {
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
            }
        });
    }
    else {
        console.log('b')
        following = false;
        followingNames = [];
        db.search(timestamp, limit, req.body.q, req.body.username, following, followingNames, (err, result) => {
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
    }

    /*
        db.search(timestamp, limit, req.body.q, req.body.username, (err, result) => {
            if (err) {
                res.status(500).send({
                    status: "error",
                    error: err
                });
            } else {
                //console.log(result);
                console.log(req.session);
                ////if logged in and either following not specific or specified as yes, filter tweets
                if (req.session.loggedin && (typeof req.body.following === 'undefined' || req.body.following)) {
                    console.log('a');
                    //console.log(result);
                    let following = [];
                    let filteredResult = [];
                    db.getFollowing(req.session.username, 99999, (err, users) => {
                        if (err) {
                            res.status(500).send({
                                status: "error",
                                error: err
                            });
                        } else {
                            users.forEach(user => {
                                following.push(user.User);
                            });
                            result.forEach(tweet => {
                                if (following.includes(tweet.username)) {
                                    filteredResult.push(tweet);
                                }
                            });
                            res.status(200).send({
                                status: "OK",
                                error: null,
                                items: filteredResult
                            })
                        }
                    });
                }
                else {
                    console.log('b');
                    res.status(200).send({
                        status: "OK",
                        error: null,
                        items: result
                    })
                }
            }
        })
        */
})

app.get('/user/:username', function (req, res) {
    let username = req.params.username;
    console.log(`getting profile of ${username}`);
    db.getProfile(username, (err, result) => {
        if (err) {
            res.status(500).send({
                status: "error",
                error: err
            });
        } else {
            //let email = result.email;
            //result.forEach(follower => {
            //    followers.push(follower.Follower)
            //});
            if (result === undefined || result.length == 0) {
                res.status(500).send({
                    status: "error",
                    error: err
                });
            } else {
                res.status(200).send({
                    status: "OK",
                    user: {
                        email: result.email,
                        followers: result.followers,
                        following: result.following
                    }
                });
            }
        }
    })
})

app.get('/user/:username/posts', function (req, res) {
    let username = req.params.username;
    console.log(`Getting posts from ${username}`);
    let limit = 50;
    if (req.query.limit) {
        limit = req.query.limit;
        if (limit > 200 || limit < 0) {
            limit = 200;
        }
    }
    db.getTweetsFromUser(username, limit, (err, result) => {
        if (err) {
            res.status(500).send({
                status: "error",
                error: err
            });
        } else {
            let tweets = [];
            result.forEach(tweet => {
                tweets.push(tweet.id);
            });
            res.status(200).send({
                status: "OK",
                error: null,
                items: tweets
            })
        }
    })
})

app.get('/user/:username/followers', function (req, res) {
    let username = req.params.username;
    console.log(username);
    let limit = 50;
    if (req.query.limit) {
        limit = req.query.limit;
        if (limit > 200 || limit < 0) {
            limit = 200;
        }
    }
    let followers = [];
    db.getFollowers(username, limit, (err, result) => {
        if (err) {
            res.status(500).send({
                status: "error",
                error: err
            });
        } else {
            result.forEach(follower => {
                followers.push(follower.Follower)
            });
            res.status(200).send({
                status: "OK",
                error: null,
                users: followers
            })
        }
    })
})

app.get('/user/:username/following', function (req, res) {
    let username = req.params.username;
    console.log(username);
    let limit = 50;
    if (req.query.limit) {
        limit = req.query.limit;
        if (limit > 200 || limit < 0) {
            limit = 200;
        }
    }
    let following = [];
    db.getFollowing(username, limit, (err, result) => {
        if (err) {
            res.status(500).send({
                status: "error",
                error: err
            });
        } else {
            console.log(result);
            result.forEach(user => {
                following.push(user.User)
            });
            res.status(200).send({
                status: "OK",
                error: null,
                users: following
            })
        }
    })
})

app.post('/follow', function (req, res) {
    if (!req.session.loggedin) {
        //if (false) {
        res.status(500).send({
            status: "error",
            error: "Not logged in"
        });
    }
    else {
        let follower = req.session.username;
        console.log(follower);
        //let follower = req.body.follower;
        let user = req.body.username;
        console.log(user);
        db.getUser(user, (err, result) => {
            if (err) {
                res.status(500).send({
                    status: "error",
                    error: err
                });
            }
            else if (!result) {
                console.log(result);
                res.status(500).send({
                    status: "error",
                    error: err
                });
            }
            else {
                if (req.body.follow === true) {
                    console.log(`${follower} is following ${user}`);
                    db.follow(user, follower, (err, result) => {
                        if (err) {
                            res.status(500).send({
                                status: "error",
                                error: err
                            });
                        }
                        else {
                            db.incrementFollowCounts(user, follower, (err, result) => {
                                if (err) {
                                    res.status(500).send({
                                        status: "error",
                                        error: err
                                    });
                                }
                                else {
                                    res.status(200).send({
                                        status: "OK",
                                        error: null
                                    })
                                }
                            })
                        }
                    })
                }
                else {
                    console.log(`${follower} is unfollowing ${user}`);
                    db.unfollow(user, follower, (err, result) => {
                        if (err) {
                            res.status(500).send({
                                status: "error",
                                error: err
                            });
                        }
                        else {
                            db.decrementFollowCounts(user, follower, (err, result) => {
                                if (err) {
                                    res.status(500).send({
                                        status: "error",
                                        error: err
                                    });
                                }
                                else {
                                    res.status(200).send({
                                        status: "OK",
                                        error: null
                                    })
                                }
                            })
                        }
                    })
                }
            }
        });
    }
})

var server = app.listen(80, function () {
    var host = server.address().address
    var port = server.address().port

    console.log("Example app listening at http://%s:%s", host, port)
})
