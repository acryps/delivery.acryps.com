import { Point } from "../../shared/point";

export class Player {
	readonly id = Math.random().toString(36).substring(2, 8);

	moveAngle: number | null = null;

	constructor (
		public socket: WebSocket,
		public position: Point
	) {
		console.log('created player at', position);
	}

	toJSON() {
		return {
			id: this.id,
			position: this.position
		}
	}
}