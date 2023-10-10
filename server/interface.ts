import { Game } from "./game/game";
import { Player } from "./game/player";
import { Point } from "./game/point";

export interface GameReceiveMessage {
	start?: boolean;
	moveAngle?: number;
}

export interface GameSendMessage {
	move?: {
		id: string;
		position: Point;
	}[];

	leave?: Player
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
		const game = games.find(game => game.token == request.query.token.toLowerCase());

		if (!game) {
			return socket.close();
		}

		const player = new Player(socket, game.map.center);

		game.join(player);

		socket.onmessage = message => (gameMessage: GameReceiveMessage = message.data) => {
			if (gameMessage.start) {
				game.start(player);
			}

			if (gameMessage.moveAngle != null) {
				player.moveAngle = gameMessage.moveAngle;
			}
		}

		socket.onclose = () => game.leave(player);
	});
}