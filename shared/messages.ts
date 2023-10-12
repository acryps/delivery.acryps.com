import { Delivery } from "./delivery";
import { Point } from "./point";

export interface PlayerMessage {
	id: string;
	position: Point;
}

export interface DeliveryMessage {
	id: string;
	assignee: string;
	source: string;
	destination: string;
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

	start?: boolean,

	leave?: PlayerMessage,
	join?: PlayerMessage,

	assigned?: DeliveryMessage;
	pickedUp?: string;
	delivered?: string;
}