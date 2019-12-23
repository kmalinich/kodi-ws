/* Require the module */
const kodi = require('../');

kodi('127.0.0.1', 9090).then((connection) =>
	/* Get all active players and log them */
	 connection.Player.GetActivePlayers().then((players) => {
		console.log('Active players:');
		console.log(JSON.stringify(players));

		/* Log the currently played item for all players */
		return Promise.all(players.map((player) => connection.Player.GetItem(player.playerid).then((item) => {
			console.log('Currently played for player[' + player.playerid + ']:');
			console.log(JSON.stringify(item));
		})));
	})
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
