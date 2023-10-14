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
		const maxTokenValue = 2176782336; // token is base 36 and 6 characters long

		return `hsl(${360 / maxTokenValue * parseInt(this.id, 36)}, 100%, 70%)`;
	}
}
