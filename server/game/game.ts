import { Map } from "../../shared/map";
import { Player } from "./player";
import { move } from "../../shared/move";
import { ServerMessage } from "../../shared/messages";

export class Game {
	readonly ticksPerSecond = 30;
	readonly tickMillisecondsInterval = 1 / this.ticksPerSecond * 1000;

	readonly token = Math.random().toString(36).substring(2, 8);

	players: Player[] = [];
	map: Map;

	private gameLoop: NodeJS.Timeout;

	constructor(map: Map) {
		this.players = [];
		this.map = map;
	}

	join(player: Player) {
		if (this.gameLoop) {
			console.warn(`user ${player.id} tried to join running game ${this.token}`);
			throw new Error('can\'t join running game');
		}

		player.assignPackage(this.map);
		this.players.push(player);
		
		this.broadcast({
			join: player
		});

		console.log(`player '${player.id}' joined game '${this.token}'`);
	}

	leave(player: Player) {
		this.players.splice(this.players.indexOf(player), 1);

		this.broadcast({
			leave: player
		});

		if (!this.players.length) {
			this.stop();
		}
	}

	start(player: Player) {
		if (!this.isHost(player)) {
			console.warn(`non host user ${player.id} tried to start the game ${this.token}`);
			throw new Error('unauthorized to start game');
		}

		this.broadcast({
			start: true
		});

		console.log(`started game ${this.token} with ${this.ticksPerSecond} ticks per second`);

		let lastTick = Date.now();

		this.gameLoop = setInterval(() => {
			if (Date.now() > lastTick + this.tickMillisecondsInterval) {
				const deltaTime = (Date.now() - lastTick) / 1000;

				for (const player of this.players) {
					player.position = move(this.map, player.position, player.moveAngle, deltaTime);
				}

				this.broadcast({
					move: this.players.map(player => ({
						id: player.id,
						position: player.position
					}))
				});

				lastTick = Date.now();
			}
		});
	}

	stop() {
		clearInterval(this.gameLoop);
		console.log(`stopped game ${this.token}`);
	}

	private isHost(player: Player) {
		// first player is always the host
		return this.players.indexOf(player) == 0;
	}

	private broadcast(message: ServerMessage) {
		for (const player of this.players) {
			player.socket.send(JSON.stringify(message));
		}
	}
}