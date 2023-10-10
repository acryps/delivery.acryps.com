import { Game } from "./game/game";
import { Player } from "./game/player";
<<<<<<< HEAD
import { DbContext } from "./managed/database";
=======
import { Point } from "./game/point";
>>>>>>> e5bac7f24e220e41c6b7b06802cf361ac89d22b1

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
		const game = games.find(game => game.token == request.params.token.toLowerCase());

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