import { Game } from "./game/game";
import { Player } from "./game/player";
import { DbContext } from "./managed/database";

type SocketMessage = {
	type: SocketMessageType;
	data: any;
}

enum SocketMessageType {
	Start,
	Move
}

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

	app.ws('/join/:token', (socket: WebSocket, request) => {
		const game = games.find(game => game.token == request.params.token);

		if (!game) {
			return socket.close();
		}

		const player = new Player(socket, game.map.center);

		game.join(player);

		socket.onmessage = message => (socketMessage: SocketMessage = message.data) => {
			switch (socketMessage.type) {
				case SocketMessageType.Start:
					game.start(player);

					break;

				case SocketMessageType.Move:
					player.moveDirection = socketMessage.data;

					break;

				default:
					console.error('Event not implemented');

					break;
			}
		}

		socket.onclose = () => game.leave(player);
	});
}