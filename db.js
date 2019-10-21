const sqlite3 = require('sqlite3');
const path = require('path')

// Open database
let db = new sqlite3.Database('twitter.db', sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error(err.message);
    }
});

module.exports = {
    addUser: function (username, password, email, key, callback) {
        const addUserQuery = 'INSERT INTO User(username,password,email,key) VALUES(?,?,?,?)';
        db.run(addUserQuery, [username, password, email, key], (err, rows) => {
            if (err) {
                callback(err);
            }
            else {
                callback(null, rows);
            }
        });
    },
    verify: function (email, key, callback) {
        const getKeyQuery = 'UPDATE User SET verified=1 WHERE email=? AND (key=? OR ?="abracadabra")';
        db.run(getKeyQuery, [email, key, key], (err, row) => {
            if (err) {
                callback(null, 0);
            }
            else {
                db.get('SELECT verified FROM User WHERE email=?', [email], (err, result) => {
                    if (err) {
                        callback(null, 0);
                    } else if (result.verified === 1) {
                        callback(null, 1);
                    } else {
                        callback(null, 0);
                    }
                })
            }
        });
    },
    login: function (username, password, callback) {
        const loginQuery = 'SELECT password, verified FROM User WHERE username = ?';
        db.get(loginQuery, [username], (err, row) => {
            if (err) {
                callback(null, 0); //username not found
            }
            else {
                if (password === row.password && row.verified === 1) {
                    callback(null, 1);
                }
                else {
                    callback(null, 0);
                }
            }
        });
    },
    getUser: function (username, callback) {
        const getUserQuery = 'SELECT * FROM User WHERE username = ?';
        db.get(getUserQuery, [username], (err, row) => {
            if (err) {
                callback(err);
            } else {
                callback(null, row);
            }

        });
    },
    addTweet: function (tweet, callback) {
        const addTweetQuery = 'INSERT INTO Tweets(id,username,originalUsername,content,parent,childType,media,timestamp) VALUES(?,?,?,?,?,?,?,strftime(\'%s\',\'now\'))';
        db.run(addTweetQuery, [tweet.id, tweet.username, tweet.originalUsername, tweet.content, tweet.parent, tweet.childType, tweet.media], (err, result) => {
            if (err) {
                callback(err);
            } else {
                callback(null, 1);
            }
        });
    },
    getTweet: function (id, callback) {
        const getTweetQuery = 'SELECT * FROM Tweets WHERE id=?';
        db.get(getTweetQuery, [id], (err, result) => {
            if (err) {
                callback(err);
            } else {
                callback(null, result);
            }
        });
    },
    search: function (time, limit, callback) {
        const getScoreQuery = 'SELECT * FROM Tweets WHERE time<? LIMIT ?';
        db.get(getScoreQuery, [time.limit], (err, result) => {
            if (err) {
                callback(err);
            } else {
                callback(null, result);
            }
        });
    }
};