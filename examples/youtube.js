/* Require the module */
const kodi = require('../');

/* Define a youtube video ID */
const videoId = '-ZOiX6cIT8o';

/* Construct url to play with youtube plugin */
const url = 'plugin://plugin.video.youtube/?action=play_video&videoid=' + videoId;

/* Utility function to stop all active players of a kodi instance */
function stopAllActivePlayers(connection) {
	return connection.Player.GetActivePlayers().then((players) =>
		/* Stop everything thats playing */
		Promise.all(players.map((player) => connection.Player.Stop(player.playerid)))
	);
}

/* Connect to instance */
kodi('127.0.0.1', 9090).then((connection) => stopAllActivePlayers(connection).then(() =>
	/* Start the video */
	connection.Player.Open({
		item : {
			file : url,
		},
	})
).then(() =>
	/* Stop the video after 20 seconds */
	new Promise((resolve, reject) => {
		setTimeout(() => {
			stopAllActivePlayers(connection).then(resolve, reject);
		}, 20000);
	})
)).catch((e) => {
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
