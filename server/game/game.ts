import { Map } from "../../shared/map";
import { PlayerController } from "./player";
import { ServerMessage } from "../../shared/messages";

export class Game {
	readonly ticksPerSecond = 30;
	readonly tickMillisecondsInterval = 1 / this.ticksPerSecond * 1000;

	readonly token: string;

	players: PlayerController[] = [];
	map: Map;

	private gameLoop: NodeJS.Timeout;

	constructor(map: Map) {
		this.players = [];
		this.map = map;
		this.token = Math.random().toString(36).substring(2, 8);

		console.log(`game '${this.token}' created`);
	}

	join(player: PlayerController) {
		if (this.gameLoop) {
			console.warn(`user ${player.id} tried to join running game ${this.token}`);
			throw new Error('can\'t join running game');
		}

		this.players.push(player);
		this.assignPackage(player);
		
		this.broadcast({
			join: player
		});

		console.log(`player '${player.id}' joined game '${this.token}'`);
	}

	assignPackage(player: PlayerController) {
		player.pickedUp = null;

		const delivery = this.map.planDelivery();
		player.assigned = delivery;
		delivery.assignee = player;

		const offsetDirection = Math.random() * Math.PI * 2;

		// move away form the pickup location
		player.position = player.assigned.source.entrance.walk(offsetDirection, PlayerController.pickupOffsetRadius);

		// walk away in the same direction until we are not intersecting any houses anymore
		while (this.map.collides(player.position)) {
			player.position = player.position.walk(offsetDirection, player.speed);
		}

		this.broadcast({
			assigned: delivery.toJSON()
		});
	}

	leave(player: PlayerController) {
		this.players.splice(this.players.indexOf(player), 1);

		this.broadcast({
			leave: player
		});

		if (!this.players.length) {
			this.stop();
		}
	}

	start(player: PlayerController) {
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
					player.move(player.moveAngle, deltaTime, this.map, delivery => {
						this.broadcast({ pickedUp: delivery.id });

						delivery.carrier = player;
					}, delivery => {
						this.broadcast({ delivered: delivery.id });

						this.assignPackage(player);
					});
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

	private isHost(player: PlayerController) {
		// first player is always the host
		return this.players.indexOf(player) == 0;
	}

	private broadcast(message: ServerMessage) {
		for (const player of this.players) {
			player.socket.send(JSON.stringify(message));
		}
	}
}