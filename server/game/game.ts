import { Map } from "../../shared/map";
import { PlayerController } from "./player";
import { ServerMessage } from "../../shared/messages";
import { BuildingViewModel } from "../../shared/building";
import { tokenLength } from "../../shared/constants";
import { Rectangle } from "../../shared/rectangle";
import { Delivery } from "../../shared/delivery";

export class Game {
	readonly ticksPerSecond = 30;
	readonly tickMillisecondsInterval = 1 / this.ticksPerSecond * 1000;
	readonly stealingDistance = 1;

	readonly token: string;

	map: Map;
	
	players: PlayerController[] = [];
	deliveries: Delivery[] = [];

	onStop: () => void;

	private gameLoop: NodeJS.Timeout;

	get isRunning() {
		return !!this.gameLoop;
	}

	constructor(map: Map) {
		this.players = [];
		this.map = map;
		this.token = Math.random().toString(36).substring(2, 2 + tokenLength);

		console.log(`game '${this.token}' created`);
	}

	join(player: PlayerController) {
		if (this.gameLoop) {
			console.warn(`user ${player.name} tried to join running game ${this.token}`);
			throw new Error();
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

		const playerLeaveMessage = `player '${player.name}' left game '${this.token}'`;

		if (!this.players.length) {
			console.log(playerLeaveMessage);
			this.stop();
		} else {
			console.log(`${playerLeaveMessage}, '${this.players[0].name} is now host'`);
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
		if (player.pickedUp) {
			player.score += player.pickedUp.worth;
			player.pickedUp = null;
		}

		const usedBuildings: BuildingViewModel[] = []; 

		for (let player of this.players) {
			if (player.assigned) {
				usedBuildings.push(player.assigned.source, player.assigned.destination);
			}
		}

		const delivery = this.map.planDelivery(usedBuildings);
		player.assigned = delivery;
		delivery.assignee = player;

		// walk away from the building in random directions until we are not in a building anymore
		const minimalDistance = PlayerController.pickupOffsetDistance + Math.max(delivery.source.boundingBox.latitudeLength, delivery.source.boundingBox.longitudeLength);
		let distance = minimalDistance;

		do {
			player.position = delivery.source.center.walk(Math.random() * Math.PI * 2, distance);

			distance += PlayerController.pickupWalkingDistance;

			// to make sure that the distance never overflows
			if (distance > this.map.radius) {
				distance = minimalDistance;
			}
		} while (this.map.collides(player.position));

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