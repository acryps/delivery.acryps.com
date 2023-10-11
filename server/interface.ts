import { Game } from "./game/game";
import { Player } from "./game/player";
import { Building, DbContext } from "./managed/database";
import { Point } from "../shared/point";
import { ClientMessage } from "../shared/messages";
import { BuildingViewModel } from "../shared/building";
import { Map } from "../shared/map";

export function registerInterface(app, database: DbContext) {
	const games: Game[] = [];

	app.post('/game', async (request, response) => {
		const center = {
			latitude: request.body.center.latitude,
			longitude: request.body.center.longitude
		};

		const radius = request.body.radius;

		const buildings = (await database.building.toArray()).map(building => new BuildingViewModel(
			building.address,
			building.polygon.split(';').map(point => new Point(+point.split(',')[0], +point.split(',')[1]))
		));

		const game = new Game(new Map(center, radius, buildings));
		games.push(game);

		response.json(game.token);
	});

	app.get('/map/:token', async (request, response) => {
		const game = games.find(game => game.token == request.params.token);

		if (!game) {
			return response.json({});
		}

		response.json(game.map);
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