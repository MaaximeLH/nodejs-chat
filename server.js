let express      = require('express');
let app          = express();
let server       = require('http').createServer(app);
let io           = require('socket.io')(server);
let port         = process.env.PORT || 8080;
let participants = 0;
let users        = new Array();
let messages     = new Array();
let colors       = [
    '#1abc9c',
    '#2ecc71',
    '#3498db',
    '#9b59b6',
    '#34495e',
    '#16a085',
    '#27ae60',
    '#2980b9',
    '#8e44ad',
    '#2c3e50',
    '#f1c40f',
    '#e67e22',
    '#e74c3c',
    '#95a5a6',
    '#f39c12',
    '#d35400',
    '#c0392b',
    '#7f8c8d'
];

server.listen(port, function(){
    console.log('/');
});

io.on('connection', function(socket){

    socket.username = undefined;
    socket.color    = undefined;

    socket.on('new message', function(message){
        if(message === undefined || message == "" || message.length <= 3 || message.length > 400 || socket.username === undefined){
            socket.emit('new message error', true);
            return false;
        }

        io.emit("new message", socket.username, socket.color, message);
        socket.spam = (new Date().getTime() / 1000).toFixed();
        socket.emit('new message success', true);
        messages.push('<b style="color:'+socket.color+';">'+socket.username + '</b> : ' + message);
        for(var i = messages.length-1; i--;){
            if(i == 6){
                messages.shift();
            }
        }
    });

    socket.on('login request', function(username){
        if(socket.username != undefined || username == undefined || username == "" || username.length < 3 || username.length > 35 || users.indexOf(username) != -1){
            socket.emit('login request error', true);
            return false;
        }

        socket.username = username;
        socket.color    = colors[Math.floor(Math.random() * colors.length)];

        socket.emit('login request success', true);
        socket.emit('message history', messages);
        users.push(socket.username + ' -|- ' + socket.color);
        io.emit('new activity', socket.username, socket.color, 'vient de se connecter au salon.');

        participants++;
        io.emit('participants', participants);
        io.emit('users', users);
    });

    socket.on('disconnect', function(){
        if(socket.username !== undefined){
            participants--;
            io.emit('new activity', socket.username, socket.color, 'vient de se déconnecter du salon.');
            io.emit('participants', participants);
            delete users[users.indexOf(socket.username + ' -|- ' + socket.color)];
            io.emit('users', users);
            delete socket;
        }
    });

});

app.use(express.static(__dirname + '/html'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/html/index.html');
});
