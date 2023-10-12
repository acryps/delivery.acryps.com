import { Delivery } from "../../shared/delivery";
import { Map } from "../../shared/map";
import { Point } from "../../shared/point";

export class PlayerController {
	static readonly pickupOffsetRadius = 0.0001;

	readonly id = Math.random().toString(36).substring(2, 8);

	moveAngle: number | null = null;

	assigned: Delivery;
	pickedUp: Delivery;

	constructor (
		public socket: WebSocket,
		public position: Point
	) {
		console.log('created player at', position);
	}

	move(angle: number, distance: number, map: Map, onPickUp: (delivery: Delivery) => void, onDeliver: (delivery: Delivery) => void) {
		if (angle === null) {
			return;
		}

		const targetPoint = this.position.walk(angle, distance);
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
			position: this.position
		}
	}
}