import { Game } from "./game/game";
import { PlayerController } from "./game/player";
import { DbContext } from "./managed/database";
import { Point } from "../shared/point";
import { ClientMessage } from "../shared/messages";
import { BuildingViewModel } from "../shared/building";
import { Map } from "../shared/map";
import { Rectangle } from "../shared/rectangle";
import { AreaLoader } from "./importer/area-loader";
import { Railway } from "../shared/railway";
import { gameConfiguration } from "../shared/constants";

export function registerInterface(app, database: DbContext) {
	const games: Game[] = [];

	app.post('/game', async (request, response) => {
		const center = new Point(request.body.center.latitude, request.body.center.longitude);
		let radius = request.body.radius;
		let duration = request.body.duration;

		if (!(radius in gameConfiguration.radii)) {
			radius = gameConfiguration.radii[gameConfiguration.defaultRadiusIndex];
		}

		if (!(duration in gameConfiguration.durationMinutes)) {
			duration = gameConfiguration.durationMinutes[gameConfiguration.defaultDurationIndex];
		}

		const boundingBox = Rectangle.fromCenterRadius(center, radius);
		let areaLoader = new AreaLoader(database);
		await areaLoader.importArea(center);

		// get all buildings in a way larger the area
		// then take all buildings that touch the bounding box
		const doubleBoundingBox = Rectangle.fromCenterRadius(center, radius * 1.5);

		const buildings = await database.building
			.where(building => building.centerLatitude.valueOf() > doubleBoundingBox.minLatitude)
			.where(building => building.centerLatitude.valueOf() < doubleBoundingBox.maxLatitude)
			.where(building => building.centerLongitude.valueOf() > doubleBoundingBox.minLongitude)
			.where(building => building.centerLongitude.valueOf() < doubleBoundingBox.maxLongitude)
			.toArray();

		const railways = await database.railway
			.where(railway => railway.minLatitude.valueOf() > doubleBoundingBox.minLatitude)
			.where(railway => railway.maxLatitude.valueOf() < doubleBoundingBox.maxLatitude)
			.where(railway => railway.minLongitude.valueOf() > doubleBoundingBox.minLongitude)
			.where(railway => railway.maxLongitude.valueOf() < doubleBoundingBox.maxLongitude)
			.toArray();

		const map = new Map(
			center, 
			radius, 
			buildings.map(building => new BuildingViewModel(
				building.id,
				building.address,
				Point.unpack(building.polygon)
			)),
			railways.map(railway => new Railway(
				Point.unpack(railway.path),
				railway.gauge
			))
		);

		const game = new Game(map, duration);
		games.push(game);
		
		game.onclose = () => games.splice(games.indexOf(game), 1);

		response.json(game.token);
	});

	app.get('/game/:token', async (request, response) => {
		const game = games.find(game => game.token == request.params.token.toLowerCase());

		if (!game) {
			response.json(false);
		} else {
			response.json(!game.isRunning);
		}
	});

	app.get('/map/:token', async (request, response) => {
		const game = games.find(game => game.token == request.params.token.toLowerCase());

		if (!game) {
			return response.json(null);
		}

		response.json(game.map);
	});

	app.get('/duration/:token', async (request, response) => {
		const game = games.find(game => game.token == request.params.token.toLowerCase());

		if (!game) {
			return response.json(null);
		}

		response.json(game.durationMinutes);
	});

	app.ws('/join/:token', (socket, request) => {
		const game = games.find(game => game.token == request.params.token.toLowerCase());

		if (!game) {
			return socket.close();
		}

		const player = new PlayerController(socket, game.map.center);

		socket.send(JSON.stringify({
			id: player.id,
			peers: game.players
		}));

		try {
			game.join(player);
		} catch (error) {
			socket.close();
		}

		socket.on('message', data => {
			const gameMessage: ClientMessage = JSON.parse(data);

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