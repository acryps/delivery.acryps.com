import { Delivery } from "../../shared/delivery";
import { Map } from "../../shared/map";
import { Point } from "../../shared/point";

const randomNameGenerator = require('boring-name-generator');

export class PlayerController {
	static readonly pickupOffsetRadius = 50;

	readonly id = Math.random().toString(36).substring(2, 8);
	readonly name = randomNameGenerator().spaced;

	readonly speed = 100;

	moveAngle: number | null = null;

	assigned: Delivery;
	pickedUp: Delivery;

	constructor (
		public socket: WebSocket,
		public position: Point
	) {
		console.log('created player at', position);
	}

	move(angle: number, deltaTime: number, map: Map, onPickUp: (delivery: Delivery) => void, onDeliver: (delivery: Delivery) => void) {
		if (angle === null) {
			return;
		}

		const targetPoint = this.position.walk(angle, this.speed * deltaTime);
		const building = map.collides(targetPoint);

		if (this.assigned?.source == building && !this.assigned.carrier) {
			this.pickedUp = this.assigned;

			onPickUp(this.pickedUp);

			return;
		}

		if (this.pickedUp?.destination == building) {
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