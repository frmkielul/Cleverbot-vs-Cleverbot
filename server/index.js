/* FUCK. JAVASCRIPT. FUCK. JAVASCRIPT. FUCK. JAVASCRIPT. FUCK. JAVASCRIPT. */

var API_KEY = "abc_xyz";

io = require('socket.io').listen(3000);
Cleverbot = require('cleverbot-node');
class ConversationHandler {
	constructor() {
		this.conversations = [];
	}
	add(socket, promptString) {
		var exists = false;
		this.conversations.forEach(function(index) {
			if (index.socket == socket) exists = true;
		}.bind(this));
		if (!exists) {
			this.conversations.push(new Conversation(socket, promptString));
			console.log("New conversation created by socket id: " + socket.id);
		}
	}
	destroy(socket) {
		socket.emit('response', "Conversation stopped.");
		this.conversations.forEach(function(index) {
			if (index.socket == socket) {
				index.destroy();
				var i = this.conversations.indexOf(index);
				if (i > -1) {
					this.conversations.splice(i, 1);
				}
			}
		}.bind(this));
	}
}
class Conversation {
	constructor(_socket, promptString) {
		this.socket = _socket;
		this.destroyed = false;
		this.cleverbot = new Cleverbot;
		this.cleverbot.configure({botapi: API_KEY});
		this.promptA(promptString);
	}
	promptA(message) {
		if (this.destroyed) return;
		Cleverbot.prepare(function() {
			this.cleverbot.write(message, function(response) {
				console.log("Cleverbot A: " + response.message);
				this.socket.emit('a', response.message);
				setTimeout(function() {
					this.promptB(response.message);
				}.bind(this), 1000);
			}.bind(this));
		}.bind(this));
	}
	promptB(message) {
		if (this.destroyed) return;
		Cleverbot.prepare(function() {
			this.cleverbot.write(message, function(response) {
				console.log("Cleverbot B: " + response.message);
				this.socket.emit('b', response.message);
				setTimeout(function() {
					this.promptA(response.message);
				}.bind(this), 1000);
			}.bind(this));
		}.bind(this));
	}
	destroy() {
		console.log("Destroy called. Socket: " + this.socket.id);
		this.destroyed = true;
	}
}
var ch = new ConversationHandler();

io.sockets.on('connection', function (socket) {
		console.log("Client connected: " + socket.id);
    socket.on('cleverbot_prompt', function(initialPrompt) {
		console.log("PROMPT: " + initialPrompt);
		ch.add(socket, initialPrompt);
		console.log(ch.conversations.length);
    });
	socket.on('disconnect', function() {
		ch.destroy(socket);
		console.log("Client disconnected: " + socket.id + " - Destroying conversation.");
		console.log(ch.conversations.length);
    });
	socket.on('cleverbot_stop', function() {
		console.log("Conversation stopped. Socket id: " + socket.id);
		ch.destroy(socket);
		console.log(ch.conversations.length);
	});
});
