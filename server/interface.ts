import { Game } from "./game/game";
import { Player } from "./game/player";
import { DbContext } from "./managed/database";
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

		game.join(player);

		socket.send(player.id);

		socket.on('message', data => {
			const gameMessage: GameReceiveMessage = JSON.parse(data);
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