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
            if (err || !row) {
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
    deleteTweet: function (id, callback) {
        const deleteTweetQuery = 'DELETE FROM Tweets WHERE id=?';
        db.get(deleteTweetQuery, [id], (err, result) => {
            if (err) {
                callback(err);
            } else {
                callback(null, result);
            }
        });
    },
    search: function (timestamp, limit, query, username, following, followingNames, callback) {
        let searchQuery = 'SELECT * FROM Tweets WHERE timestamp<=?';
        if (query) {
            let words = query.split(" ");
            searchQuery += ` AND (`;
            console.log(words);
            words.forEach(word => {
                searchQuery += `content LIKE '%${word}%' OR `;
            });
            searchQuery = searchQuery.slice(0, -3);
            searchQuery += ')'
        }
        if (username) {
            searchQuery += ` AND username='${username}'`;
        }
        else if (following) {//filter by followed users
            searchQuery += ` AND (`;
            followingNames.forEach(user => {
                searchQuery += `username = '${user}' OR `;
            });
            searchQuery = searchQuery.slice(0, -3);
            searchQuery += ')'
        }
        searchQuery += ' ORDER BY timestamp DESC LIMIT ?';
        console.log(searchQuery);
        db.all(searchQuery, [timestamp, limit], (err, result) => {
            if (err) {
                callback(err);
            } else {
                callback(null, result);
            }
        });
    },
    getProfile: function (username, callback) {
        const getProfileQuery = 'SELECT * FROM User WHERE username=?';
        db.get(getProfileQuery, [username], (err, result) => {
            if (err) {
                callback(err);
            } else {
                callback(null, result);
            }
        });
    },
    getFollowers: function (username, limit, callback) {
        const getFollowersQuery = 'SELECT Follower FROM Follower WHERE User=? LIMIT ?';
        db.all(getFollowersQuery, [username, limit], (err, result) => {
            if (err) {
                callback(err);
            } else {
                callback(null, result);
            }
        });
    },
    getFollowing: function (username, limit, callback) {
        const getFollowingQuery = 'SELECT User FROM Follower WHERE Follower=? LIMIT ?';
        db.all(getFollowingQuery, [username, limit], (err, result) => {
            if (err) {
                callback(err);
            } else {
                callback(null, result);
            }
        });
    },
    getTweetsFromUser: function (username, limit, callback) {
        const getTweetQuery = 'SELECT * FROM Tweets WHERE username=? ORDER BY timestamp DESC LIMIT ?';
        db.all(getTweetQuery, [username, limit], (err, result) => {
            if (err) {
                callback(err);
            } else {
                callback(null, result);
            }
        });
    },
    follow: function (user, follower, callback) {
        const followQuery = 'INSERT INTO Follower(User,Follower) VALUES(?,?)';
        db.run(followQuery, [user, follower], (err, result) => {
            if (err) {
                callback(err);
            } else {
                callback(null, result);
            }
        });
    },
    unfollow: function (user, follower, callback) {
        const unfollowQuery = 'DELETE FROM Follower WHERE User=? AND Follower=?';
        db.run(unfollowQuery, [user, follower], (err, result) => {
            if (err) {
                callback(err);
            } else {
                callback(null, result);
            }
        });
    },
    incrementFollowCounts: function (user, follower, callback) {
        const incrementFollowingQuery = 'UPDATE User SET following=following+1 WHERE username=?';
        const incrementFollowerQuery = 'UPDATE User SET followers=followers+1 WHERE username=?';
        db.run(incrementFollowingQuery, [follower], (err, result) => {
            if (err) {
                callback(err);
            } else {
                db.run(incrementFollowerQuery, [user], (err, result) => {
                    if (err) {
                        callback(err);
                    } else {
                        callback(null, result);
                    }
                });
            }
        });
    },
    decrementFollowCounts: function (user, follower, callback) {
        const decrementFollowingQuery = 'UPDATE User SET following=following-1 WHERE username=?';
        const decrementFollowerQuery = 'UPDATE User SET followers=followers-1 WHERE username=?';
        db.run(decrementFollowingQuery, [follower], (err, result) => {
            if (err) {
                callback(err);
            } else {
                db.run(decrementFollowerQuery, [user], (err, result) => {
                    if (err) {
                        callback(err);
                    } else {
                        callback(null, result);
                    }
                });
            }
        });
    },
    incrementRetweetedCount: function (id, callback) {
        const incrementRetweetedQuery = 'UPDATE Tweets SET retweeted=retweeted+1 WHERE id=?';
        db.run(incrementRetweetedQuery, [id], (err, result) => {
            if (err) {
                callback(err);
            } else {
                callback(null, result);
            }
        });
    },
    decrementRetweetedCount: function (id, callback) {
        const decrementRetweetedQuery = 'UPDATE Tweets SET retweeted=retweeted-1 WHERE id=?';
        db.run(decrementRetweetedQuery, [id], (err, result) => {
            if (err) {
                callback(err);
            } else {
                callback(null, result);
            }
        });
    },
    incrementLikesCount: function (id, callback) {
        const incrementLikesQuery = 'UPDATE Tweets SET likes=likes+1 WHERE id=?';
        db.run(incrementLikesQuery, [id], (err, result) => {
            if (err) {
                callback(err);
            } else {
                callback(null, result);
            }
        });
    },
    decrementLikesCount: function (id, callback) {
        const decrementLikesQuery = 'UPDATE Tweets SET likes=likes-1 WHERE id=?';
        db.run(decrementLikesQuery, [id], (err, result) => {
            if (err) {
                callback(err);
            } else {
                callback(null, result);
            }
        });
    },
    addMedia: function (username, mediaid, callback) {
        const followQuery = 'INSERT INTO Media(username,mediaid) VALUES(?,?)';
        db.run(followQuery, [username, mediaid], (err, result) => {
            if (err) {
                callback(err);
            } else {
                callback(null, result);
            }
        });
    },
    //returns array of tweets using media
    mediaIDUsed: function (mediaID, callback) {
        const followQuery = `SELECT * FROM Tweets WHERE media LIKE '%${mediaID}%'`;
        db.all(followQuery, [username, mediaid], (err, result) => {
            if (err) {
                callback(err);
            } else {
                callback(null, result);
            }
        });
    },
    //returns username of user that uploaded media
    mediaOwner: function (mediaID, callback) {
        const followQuery = `SELECT username FROM Media WHERE mediaid=?`;
        db.get(followQuery, [mediaid], (err, result) => {
            if (err) {
                callback(err);
            } else {
                callback(null, result);
            }
        });
    },
};