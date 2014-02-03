
/**
 * Module dependencies.
 */

var log = console.log;

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path');

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);
app.get('/users', user.list);

var server = http.createServer(app).listen(app.get('port'), function(){
    console.log("Express server listening on port " + app.get('port'));
});

var io = require('socket.io').listen(server);

var id=0;
var units = [];

io.sockets.on('connection', function (socket) { 
    id++;
    log('connected:'+id);
    socket.emit('connected');
    socket.emit('msg setID', id);   //ＩＤを振り出す
    socket.unitID = id;

    //既に接続しているプレイヤーの情報を送る
    for (var i = 0, len = units.length; i < len; i++) {
        socket.emit('msg addUser', units[i]);
    }

    //サーバーに接続してきた
    socket.on('msg enterServer', function (player) {
        log('enterServer:'+player.id);
        this.broadcast.emit('msg addUser', player);
        units.push(player);
    });

    //位置情報受信
    socket.on('msg position sent', function (player) {
        for (var i = 0, len = units.length; i < len; i++) {
            var p = units[i];
            if (p.id == player.id) {
                p.x = player.x;
                p.y = player.y;
            }
        }
        this.broadcast.emit('msg position push', player);
    });

    //切断処理
    socket.on('disconnect', function() {
        for (var i = 0; i < units.length; i++) {
            var p = units[i];
            if (p.id == this.unitID) {
                units.splice(i,1);
            }
        }
        this.broadcast.emit('msg disconnect player', this.unitID);
        log('disconnected'+this.unitID);
    });
});

