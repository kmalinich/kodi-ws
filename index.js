const Connection = require('./lib/Connection');


function connect(host, port) {
	return new Promise((resolve, reject) => {
		const connection = new Connection(host, port);

		connection.on('error', reject);

		connection.on('connect', () => {
			// Remove the handler so we dont try to reject on any later errors
			connection.removeListener('error', reject);

			resolve(connection);
		});
	});
}


module.exports = connect;
