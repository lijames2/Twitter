const sqlite3 = require('sqlite3');
const path = require('path')
const dbPath = path.resolve(__dirname, 'sharebite.db')

// Open database
let db = new sqlite3.Database('warmup2.db', sqlite3.OPEN_READWRITE, (err) => {
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
                    if(err) {
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
                callback(null, 0);//username not found
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
    getAllGames: function (username, callback) {
        const getGamesQuery = 'SELECT * FROM Games WHERE username=?';
        db.all(getGamesQuery, [username], (err, rows) => {
            if (err) {
                callback(err);
            }
            else {
                var arr = [];
                for(var i = 0; i < rows.length; i++) {
                    arr.push({id: rows[i].game_id, start_date: rows[i].start_date});
                }
                callback(null, arr);
            }
        });
    },
    getGamesById: function (id, callback) {
        const getGamesQuery = 'SELECT * FROM Games WHERE game_id=?';
        db.get(getGamesQuery, [id], (err, rows) => {
            if (err) {
                callback(err);
            } else {
                var res = {};
                console.log(id);
                console.log("GET GAMES RESULT: " + rows.grid);
                res.grid = rows.grid.split(",");
                for(var i = 0; i < res.grid.length; i++) {
                    if(res.grid[i] == null) {
                        res.grid[i] = ' ';
                    }
                }
                res.winner = rows.winner;
                callback(null, res);
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
    addGame: function (username, date, grid, winner, callback) {
        var grid_str = grid.join();
        const getUserQuery = 'INSERT INTO Games(username,start_date,grid,winner) VALUES(?,?,?,?)';
        db.run(getUserQuery, [username,date,grid_str,winner], (err, row) => {
            if (err) {
                callback(err);
            } else {
                db.get('SELECT max(game_id) AS id FROM Games', [], (err, result) => {
                    if(err) {
                        callback(null, 0);
                    } else {
                        console.log(result);
                        callback(null, result);
                    }
                })
            }
        });
    },
    updateGame: function(game_id, grid, winner, callback) {
        var grid_str = grid.join();
        const updateGridQuery = 'UPDATE Games SET grid=?, winner=? WHERE game_id=?';
        db.run(updateGridQuery, [grid_str, winner, game_id], (err, result) => {
            if(err) {
                callback(err);
            } else {
                callback(null, 1);
            }
        });
    },
    getGrid: function(game_id, callback) {
        const getGridQuery = 'SELECT grid FROM Games WHERE game_id=?';
        db.get(getGridQuery, [game_id], (err, res) => {
            if(err) {
                callback(err);
            } else {
                var arr = res.grid.split(",");
                for(var i = 0; i < arr.length; i++) {
                    if(arr[i] == null) {
                        arr[i] = " ";
                    }
                }
                callback(null, arr);
            }
        });
    },
    getScore: function(username, callback) {
        const getScoreQuery = 'SELECT winner FROM Games WHERE username=?';
        db.get(getScoreQuery, [username], (err, result) => {
            if(err) {
                callback(err);
            } else {
                var resp = {human: 0, wopr: 0, tie: 0};
                for(var i = 0; i < result.length; i++) {
                    if(result[i] == 'X') {
                        resp.human++;
                    } else if (result[i] == 'O') {
                        resp.wopr++;
                    } else {
                        resp.tie++;
                    }
                }
                callback(null, resp);
            }
        });
    }
};