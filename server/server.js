var express = require('express');
var io = require('socket.io');

var app = express.createServer()
  , io = io.listen(app);

app.listen(3000);
app.configure(function() {
    console.dir(require('path').resolve('qunit/'));
    app.use(express.static(require('path').resolve('qunit/')));
    app.use(express.static(require('path').resolve('server/')));
	console.dir(process.argv);
	  if(process.argv[2] != undefined) {
			app.use(express.static(require('path').resolve(process.argv[2])));
		}
	app.use(express.bodyParser());
	app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.post('/request_tests',function(req,res) {
	var scripts = req.body.scripts;
	console.dir(req.body);
	runTests(scripts);
	res.end();
});

function runTests(scripts) {
	for(var i in clientSockets) {
		clientSockets[i].emit('test',{"scripts":scripts});
	}
}

var clients = {};
var clientSockets = {};
io.sockets.on('connection', function (socket) {
	clientSockets[socket.id] = socket;
   /* setInterval(function() {
        socket.emit('test',{'scripts':['test.js']});
    },5000);
    */
  socket.on('request_tests',function(data) {
    runTests(data.scripts);
  });
	socket.on('test_data',function(data) {
		data.clientId = socket.id;
		socket.broadcast.emit('test_data',data);
		socket.emit('test_data',data);
	})
  socket.on('client_info',function(data) {
      clients[socket.id] = {
        userAgent:data.userAgent,
        clientId:socket.id
      };
      socket.broadcast.emit('clients',clients);
      socket.emit('clients',clients)
  });
	socket.on('disconnect',function() {
		delete clientSockets[socket.id];
		delete clients[socket.id];
		socket.broadcast.emit('clients',clients);
	});
});