import { Delivery } from "../../shared/delivery";
import { Point } from "../../shared/point";


export class Player {
	id: string;
	name: string;

	position: Point;
	delivery: Delivery;

	static from(serialized) {
		const player = new Player();
		player.id = serialized.id;
		player.name = serialized.name;
		player.position = Point.from(serialized.position);

		return player;
	}

	updatePosition(position) {
		this.position = new Point(position.latitude, position.longitude);
	}

	get color() {
		return `#${parseInt(this.id, 36).toString(16).padStart(6, '3f4a31').substring(0, 6)}`;
	}
}
