import { Map } from "../../shared/map";
import { Point } from "../../shared/point";
import { Package } from "./package";

export class Player {
	readonly pickupOffsetRadius = 0.0001;

	readonly id = Math.random().toString(36).substring(2, 8);

	moveAngle: number | null = null;

	constructor (
		public socket: WebSocket,
		public position: Point
	) {
		console.log('created player at', position);
	}

	assignPackage(map: Map) {
		const delivery = new Package(map);

		const offsetDirection = Math.random() * Math.PI * 2;

		// move away form the pickup location
		this.position = delivery.source.entrance.walk(offsetDirection, this.pickupOffsetRadius);

		// TODO walk away in the same direction until we are not intersecting any houses anymore

		this.socket.send(JSON.stringify({ delivery }));

		return delivery;
	}

	toJSON() {
		return {
			id: this.id,
			position: this.position
		}
	}
}