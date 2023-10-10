import { Point } from "./point";
import { Vector } from "./vector";

export class Player {
	moveDirection: Vector;

	constructor (
		public socket: WebSocket,
		public position: Point
	) {}
}