const util = require('util');
const jrpc = require('jrpc-schema');
const WebSocket = require('ws');
const EventEmitter = require('events').EventEmitter;
const set = require('set-value');
const has = require('has-value');

function Connection(host, port) {
	EventEmitter.call(this);

	this.socket = new WebSocket('ws://' + host + ':' + port + '/jsonrpc');
	this.closed = true;
	this.init();
}

util.inherits(Connection, EventEmitter);

Connection.prototype.init = function () {
	this.socket.setMaxListeners(0);
	const self = this;

	this.socket.on('open', () => {
		self.loadSchema().then((schema) => {
			self.schema = new jrpc.Schema(schema, (message) => {
				self.socket.send(message);
			});

			self.socket.on('message', (message) => {
				try {
					self.schema.handleResponse(message);
				}
				catch (err) {
					err.message = 'Failed to handle response: ' + err.message;
					self.emit('error', err);
				}
			});

			self.addShortcuts();
			self.closed = false;
			self.emit('connect');
		}).catch((err) => {
			err.message = 'Schema error: ' + err.message;
			self.emit('error', err);
		});
	});

	this.socket.on('close', () => {
		self.closed = true;
		self.emit('close');
	});

	this.socket.on('error', (err) => {
		err.message = 'Socket error: ' + err.message;
		self.emit('error', err);
	});
};

Connection.prototype.loadSchema = function () {
	const self = this;
	const fetchSchema = jrpc.run('JSONRPC.Introspect', [], this.socket.send.bind(this.socket));
	this.socket.on('message', fetchSchema.handle);

	return fetchSchema.then((schema) => {
		self.socket.removeListener('message', fetchSchema.handle);
		return schema;
	});
};

Connection.prototype.addShortcuts = function () {
	const self = this;

	Object.keys(this.schema.schema.methods).forEach((method) => {
		if (!has(self, method)) {
			set(self, method, self.schema.schema.methods[method]);
		}
	});

	Object.keys(this.schema.schema.notifications).forEach((method) => {
		if (!has(self, method)) {
			set(self, method, self.schema.schema.notifications[method]);
		}
	});
};

Connection.prototype.batch = function () {
	const rawBatch = this.schema.batch();
	const batch = {
		send : rawBatch.send.bind(rawBatch),
	};

	Object.keys(rawBatch.schema.methods).forEach((method) => {
		if (!has(batch, method)) {
			set(batch, method, rawBatch.schema.methods[method]);
		}
	});

	return batch;
};

Connection.prototype.run = function (method) {
	if (!this.schema) throw new Error('Connection not initialized!');

	const args = Array.prototype.slice.call(arguments, 1);
	const methods = this.schema.schema.methods;

	return methods[method].apply(methods, args);
};

Connection.prototype.notification = function (method, cb) {
	if (!this.schema) throw new Error('Connection not initialized!');

	return this.schema.schema.notifications[method](cb);
};

module.exports = Connection;
