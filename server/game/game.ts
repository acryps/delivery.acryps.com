import { Map } from "../../shared/map";
import { PlayerController } from "./player";
import { ServerMessage } from "../../shared/messages";
import { BuildingViewModel } from "../../shared/building";
import { tokenLength } from "../../shared/constants";

export class Game {
	readonly ticksPerSecond = 30;
	readonly tickMillisecondsInterval = 1 / this.ticksPerSecond * 1000;
	readonly stealingDistance = 0.00005;

	readonly token: string;

	players: PlayerController[] = [];
	map: Map;

	onStop: () => void;

	private gameLoop: NodeJS.Timeout;

	constructor(map: Map) {
		this.players = [];
		this.map = map;
		this.token = Math.random().toString(36).substring(2, 2 + tokenLength);

		console.log(`game '${this.token}' created`);
	}

	join(player: PlayerController) {
		if (this.gameLoop) {
			console.warn(`user ${player.name} tried to join running game ${this.token}`);
			return;
		}

		this.players.push(player);
		
		this.broadcast({
			join: player
		});

		console.log(`player '${player.name}' joined game '${this.token}'`);
	}

	leave(player: PlayerController) {
		this.players.splice(this.players.indexOf(player), 1);

		this.broadcast({
			leave: player
		});

		console.log(`player '${player.name}' left game '${this.token}'`);

		if (!this.players.length) {
			this.stop();
		}
	}

	start(player: PlayerController) {
		if (!this.isHost(player)) {
			console.warn(`non host user ${player.name} tried to start the game ${this.token}`);
			return;
		}

		for (let player of this.players) {
			this.assignPackage(player);
		}

		this.broadcast({
			start: true
		});

		console.log(`started game ${this.token}`);

		let lastTick = Date.now();

		this.gameLoop = setInterval(() => {
			if (Date.now() > lastTick + this.tickMillisecondsInterval) {
				const deltaTime = (Date.now() - lastTick) / 1000;

				// move players
				for (const player of this.players) {
					player.move(player.moveAngle, deltaTime, this.map, delivery => {
						this.broadcast({ pickedUp: delivery.id });

						delivery.carrier = player;
					}, delivery => {
						this.broadcast({ delivered: delivery.id });

						this.assignPackage(player);
					});
				}

				// check if any player stole a package
				for (const thief of this.players) {
					// you cannot be carrying a package and steal one!
					if (!thief.pickedUp) {
						for (const victim of this.players) {
							// don't eat yourself
							if (thief != victim) {
								// you can only steal if there is something to be stolen!
								if (victim.pickedUp) {
									const distance = thief.position.distance(victim.position);
									console.log(distance);

									if (distance < this.stealingDistance) {
										thief.pickedUp = victim.pickedUp;

										this.broadcast({ 
											steal: {
												thief: thief.id,
												victim: victim.id
											}
										});

										this.assignPackage(victim);
									}
								}
							}
						}
					}
				}

				// send updated locations
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

	private assignPackage(player: PlayerController) {
		player.pickedUp = null;

		const usedBuildings: BuildingViewModel[] = []; 

		for (let player of this.players) {
			if (player.assigned) {
				usedBuildings.push(player.assigned.source, player.assigned.destination);
			}
		}

		const delivery = this.map.planDelivery(usedBuildings);
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

	private stop() {
		clearInterval(this.gameLoop);
		console.log(`stopped game ${this.token}`);

		this.onStop();
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