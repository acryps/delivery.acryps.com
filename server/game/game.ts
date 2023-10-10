import { GameSendMessage } from "../interface";
import { Map } from "./map";
import { Player } from "./player";
import { Point } from "./point";

export class Game {
	readonly ticksPerSecond = 30;
	readonly tickMillisecondsInterval = 1 / this.ticksPerSecond * 1000;
	readonly playerSpeed = 5;

	readonly token = Math.random().toString(36).substring(2, 8);

	players: Player[] = [];
	map: Map;

	private isRunning: boolean;

	constructor(center: Point, radius: number) {
		this.players = [];
		this.map = new Map(center, radius);
		this.isRunning = false;
	}

	join(player: Player) {
		if (this.isRunning) {
			console.warn(`User ${player.socket} tried to join running game ${this.token}`);
			throw new Error('Can\'t join running game');
		}

		this.players.push(player);
	}

	leave(player: Player) {
		this.players.splice(this.players.indexOf(player), 1);

		if (!this.players.length) {
			this.stop();
		}
	}

	start(player: Player) {
		if (!this.isHost(player)) {
			console.warn(`Non host user ${player.socket} tried to start the game ${this.token}`);
			throw new Error('Unauthorized to start game');
		}

		console.log(`Started game ${this.token} with ${this.ticksPerSecond} ticks per second`);

		this.isRunning = true;
		let lastTick = Date.now();

		while (this.isRunning) {
			if (Date.now() > lastTick + this.tickMillisecondsInterval) {
				const deltaTime = Date.now() - lastTick;

				for (const player of this.players) {
					player.position.latitude += Math.sin(player.moveAngle) * this.playerSpeed * deltaTime;
					player.position.longitude += Math.cos(player.moveAngle) * this.playerSpeed * deltaTime;
				}

				for (const player of this.players) {
					const message: GameSendMessage = {
						move: this.players.map(player => ({
							id: player.id,
							position: player.position
						}))
					}

					player.socket.send(JSON.stringify(message));
				}

				lastTick = Date.now();
			}
		}

		console.log(`Stopped game ${this.token}`);
	}

	stop() {
		this.isRunning = false;
	}

	private isHost(player: Player) {
		// first player is always the host
		return this.players.indexOf(player) == 0;
	}
}