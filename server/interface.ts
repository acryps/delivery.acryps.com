import { Game } from "./game/game";
import { Player } from "./game/player";
import { DbContext } from "./managed/database";
import { Point } from "../shared/point";
import { ClientMessage } from "../shared/messages";

export function registerInterface(app, database: DbContext) {
	const games: Game[] = [];

	app.post('/game', (request, response) => {
		const center = {
			latitude: request.body.center.latitude,
			longitude: request.body.center.longitude
		};

		const radius = request.body.radius;

		const game = new Game(center, radius);
		games.push(game);

		response.json(game.token);
	});

	app.get('/map/:token', async (request, response) => {
		const game = games.find(game => game.token == request.params.token);

		if (!game) {
			return response.json({});
		}

		const buildings = await database.building.toArray();

		response.json({
			center: game.map.center,
			radius: game.map.radius,

			buildings: buildings.map(building => ({
				geometry: building.polygon.split(';')
			}))
		});
	});

	app.ws('/join/:token', (socket, request) => {
		const game = games.find(game => game.token == request.params.token.toLowerCase());

		if (!game) {
			return socket.close();
		}

		const player = new Player(socket, game.map.center);
		console.log(`player '${player.id}' joined game '${game.token}'`);

		socket.send(JSON.stringify({
			id: player.id,
			peers: game.players
		}));

		game.join(player);

		socket.on('message', data => {
			const gameMessage: ClientMessage = JSON.parse(data);
			console.log(gameMessage);

			if (gameMessage.start) {
				game.start(player);
			}

			if ('moveAngle' in gameMessage) {
				player.moveAngle = gameMessage.moveAngle;
			}
		});

		socket.onclose = () => game.leave(player);
	});
}