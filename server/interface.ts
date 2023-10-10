export function registerInterface(app, database) {
	const games = {};

	app.post('/game', (request, response) => {
		const center = {
			latitude: request.body.center.latitude,
			longitude: request.body.center.longitude
		};

		const radius = request.body.radius;
		const token = Math.random().toString(36).substring(2);

		games[token] = {
			// create game

			creatorKey: request.body.key
		}

		response.json(token);
	});

	app.post('/start', (request, response) => {
		const game = games[request.body.token];

		if (game.creatorKey == request.body.key) {
			// start game

			return response.json(true);
		}

		response.json(false);
	});

	app.ws('/join/:token', (socket, request) => {
		const game = games[request.query.token];

		if (!game) {
			return socket.close();
		}

		// send buildings

		// add player to game, send events etc
	});
}