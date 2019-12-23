/* Require the module */
const kodi = require('../');

/* Instantiate the connection and wait */
kodi('127.0.0.1', 9090).then((connection) =>
	/* Mute */
	connection.Application.SetMute(true).then(() =>
		/* Unmute 2,5 seconds later */
		new Promise((resolve, reject) => {
			setTimeout(() => {
				connection.Application.SetMute(false).then(resolve, reject);
			}, 2500);
		})
	)
).catch((e) => {
	/* Handle errors */
	if (e.stack) {
		console.error(e.stack);
	}
	else {
		console.error(e);
	}
}).then(() => {
	/* Finally exit this process */
	process.exit();
});
