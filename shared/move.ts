import { Point } from "./point";

export const playerSpeed = 0.00001;

export function move(current: Point, angle: number, deltaTime: number) {
	if (angle === null) {
		return new Point(current.latitude, current.longitude);
	}

	return new Point(
		current.latitude - Math.sin(angle) * playerSpeed * deltaTime,
		current.longitude - Math.cos(angle) * playerSpeed * deltaTime
	);
}