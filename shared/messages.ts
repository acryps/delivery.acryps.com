import { Point } from "./point";

export interface PlayerMessage {
	id: string;
	position: Point;
}

export interface ClientMessage {
	start?: boolean;
	moveAngle?: number;
}

export interface ServerMessage {
	move?: {
		id: string;
		position: Point;
	}[];

	delivery?: {
		source: string,
		destination: string
	}

	start?: boolean,

	leave?: PlayerMessage,
	join?: PlayerMessage
}