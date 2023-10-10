type Connection = {
	id: string;
	name: string;
}

export class Game {
	readonly ticksPerSecond = 30;
	readonly tickMillisecondsInterval = 1 / this.ticksPerSecond * 1000;

	token: string;
	connections: Connection[] = [];

	private isRunning: boolean;

	constructor(host: Connection) {
		this.token = this.createToken();
		this.connections = [host];
	}

	join(connection: Connection) {
		this.connections.push(connection);
	}

	leave(connection: Connection) {
		this.connections.splice(this.connections.indexOf(connection), 1);

		if (!this.connections.length) {
			this.stop();
		}
	}

	start(connection: Connection) {
		if (!this.isHost(connection)) {
			console.warn(`Non host user ${connection.id} tried to start the game ${this.token}`);
			throw new Error('Unauthorized to start game');
		}

		console.log(`Started game ${this.token} with ${this.ticksPerSecond} ticks per second`);

		this.isRunning = true;
		let lastTick = Date.now();

		while (this.isRunning) {
			if (Date.now() > lastTick + this.tickMillisecondsInterval) {
				// TODO update player etc...
			}
		}

		console.log(`Stopped game ${this.token}`);
	}

	stop() {
		this.isRunning = false;
	}

	private isHost(requestConnection: Connection) {
		// first in the connection list is always the host
		return this.connections.findIndex(connection => connection.id == requestConnection.id) == 0;
	}

	private createToken() {
		return Array(4).fill('').map(() => Math.random().toString(36)).join('-');
	}
}