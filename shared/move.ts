import { Map } from "./map";
import { Point } from "./point";

export const playerSpeed = 0.0001;

export function move(map: Map, current: Point, angle: number, deltaTime: number) {
	if (angle === null) {
		return new Point(current.latitude, current.longitude);
	}

	const targetPoint = new Point(
		current.latitude - Math.sin(angle) * playerSpeed * deltaTime,
		current.longitude - Math.cos(angle) * playerSpeed * deltaTime
	);

	if (map.collides(targetPoint)) {
		return new Point(current.latitude, current.longitude);
	} else {
		return targetPoint;
	}
}