import { Delivery } from "./delivery";
import { Point } from "./point";

export interface PlayerMessage {
	id: string;
	position: Point;
}

export interface PlayerJoinMessage extends PlayerMessage {
	name: string;
}

export interface DeliveryMessage {
	id: string;
	assignee: string;
	source: string;
	destination: string;
	completed: boolean;
}

export interface ClientMessage {
	start?: boolean;
	moveAngle?: number;
}

export interface ServerMessage {
	start?: boolean,
	
	leave?: PlayerMessage,
	join?: PlayerJoinMessage,
	
	move?: PlayerMessage[];
	
	assigned?: DeliveryMessage;
	pickedUp?: string;
	delivered?: string;

	steal?: {
		thief: string,
		victim: string
	}
}