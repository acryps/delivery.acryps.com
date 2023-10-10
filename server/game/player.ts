import { Point } from "./point";

export class Player {
	readonly id = Math.random().toString(36).substring(2, 8);
	moveAngle: number;

	constructor (
		public socket: WebSocket,
		public position: Point
	) {}
}