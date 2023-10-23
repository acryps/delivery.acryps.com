import { tokenLength } from "../../shared/constants";
import { Delivery } from "../../shared/delivery";
import { Map } from "../../shared/map";
import { Point } from "../../shared/point";
import { generateName } from "./name";

export class PlayerController {
	static readonly pickupOffsetDistance = 25;
	static readonly pickupWalkingDistance = 1;

	readonly id = Math.random().toString(36).substring(2, 2 + tokenLength);
	readonly name = generateName();

	readonly speed = 50 / 3.6;
	readonly deliverySlownessFactor = 0.85;

	moveAngle: number | null = null;

	assigned: Delivery;
	pickedUp: Delivery;

	score: number = 0;

	constructor (
		public socket: WebSocket,
		public position: Point
	) {}

	move(angle: number, deltaTime: number, map: Map, onPickUp: (delivery: Delivery) => void, onDeliver: (delivery: Delivery) => void) {
		if (angle === null) {
			return;
		}

		let speed = this.speed * deltaTime;

		if (this.pickedUp) {
			speed *= this.deliverySlownessFactor;
		}

		const targetPoint = this.position.walk(angle, speed);
		const building = map.collides(targetPoint);

		if (this.assigned?.source == building && !this.assigned.carrier) {
			this.pickedUp = this.assigned;

			onPickUp(this.pickedUp);

			return;
		}

		if (this.pickedUp?.destination == building) {
			this.score += this.pickedUp.worth;

			onDeliver(this.pickedUp);

			return;
		}

		if (building) {
			return;
		}

		this.position = targetPoint;
	}

	toJSON() {
		return {
			id: this.id,
			name: this.name,
			position: this.position
		}
	}
}