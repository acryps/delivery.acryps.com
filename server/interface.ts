import { Game } from "./game/game";
import { Player } from "./game/player";

type SocketMessage = {
	type: SocketMessageType;
	data: any;
}

enum SocketMessageType {
	Start,
	Move
}

export function registerInterface(app, database) {
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

	app.ws('/join/:token', (socket: WebSocket, request) => {
		const game = games.find(game => game.token == request.query.token);

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