/*

    node.js test
	2013/02/11
	This program is MIT lisence.

*/

enchant();

var server = "127.0.0.1:3000";
var socket = io.connect(server);

var gameID = 0;
var connect = false;
var userConnect = false;

var players = [];

window.onload = function() {
    game = new Game(320,320);
    game.rootScene.backgroundColor = 'rgb(0,100,0)';
    game.fps = 30;
    var sec = function( time ){ return game.fps * time; }
    var rand = function( max ){ return ~~(Math.random() * max); }

    game.preload('chara1.png');

    game.onload = function (){
	    var scene = game.rootScene;
        var player = new Sprite(32, 32);
        player.image = game.assets['chara1.png'];
        player.frame = 0;
        player.x = 160-16;
        player.y = 160-16;
        scene.addChild(player);

        var pid = new Label('0');
        pid.x = player.x;
        pid.y = player.y-16;
        pid.onenterframe = function() {
            this.text = ''+player.id;
            this.x = player.x;
            this.y = player.y-16;
        }
        scene.addChild(pid);
        
        var msg = new Label('待機中・・・');
        msg.x = 8;
        msg.y = 320-16;
        msg.onenterframe = function() {
            if (userConnect) {
                this.text = '接続中 :'+gameID;
            } else {
                this.text = '待機中・・・:'+gameID;
            }
        }
        scene.addChild(msg);

        var bx = 0, by = 0;
        scene.time = 0;
        scene.addEventListener('enterframe', function() {
            if (game.input.up) player.y-=3;
            if (game.input.down) player.y+=3;
            if (game.input.left) player.x-=3;
            if (game.input.right) player.x+=3;
            
            if (this.time % 1 == 0) {
                if( bx != player.x || by != player.y) {
                    //サーバーに自分の座標を送る
                    var pl = {};
                    pl.id = player.id;
                    pl.x = player.x;
                    pl.y = player.y;
                    socket.emit('msg position sent', pl);   //自分の位置情報送信
                }
            }
            this.time++;
        });

        //サーバにプレイヤーを登録
        serverConnect(player);
    }//game.onload
    game.start();
};

//サーバ接続
function serverConnect(player) {
    // 接続できたというメッセージを受け取ったら
    socket.on('connected', function() {
        connect = true;
    });
    //ＩＤセットメッセージ受信
    socket.on('msg setID', function(msg) {
        gameID = msg;
        player.id = gameID;
        //プレイヤー情報をサーバーに送る
        var pl={};
        pl.id = gameID;
        pl.x = player.x;
        pl.y = player.y;
        socket.emit('msg enterServer', pl);
    });
    
    //プレイヤー追加
    socket.on('msg addUser', function(msg) {
        if (msg.id == gameID) return;
        var u = new Sprite(32, 32);
        u.image = game.assets['chara1.png'];
        u.frame = 0;
        u.id = msg.id;
        u.x = msg.x;
        u.y = msg.y;
        game.currentScene.addChild(u);
        players.push(u);
    });

    //他プレイヤー位置情報受信
    socket.on('msg position push', function(unit) {
        for (var i = 0, len = players.length; i < len; i++) {
            var p = players[i];
            if (unit.id == p.id) {
                p.x = unit.x;
                p.y = unit.y;
//                p.tl.moveTo(unit.x, unit.y, 5);
            }
        }
    });

    //他プレイヤー接続切断
    socket.on('msg disconnect player', function(id) {
        for (var i = 0; i < players.length; i++) {
            var p = players[i];
            if (p.id == id) {
                game.currentScene.removeChild(p);
                players.splice(i,1);
            }
        }
    });
}
