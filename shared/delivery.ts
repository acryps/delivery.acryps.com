import { BuildingViewModel } from "./building";
import { Map } from "./map";
import { DeliveryMessage } from "./messages";
import { Point } from "./point";

export class Delivery {
	static readonly pickupRadius = 0.001;

	id = Math.random().toString(36).substring(2);

	assignee;
	carrier;
	
	completed = false;

	source: BuildingViewModel;
	destination: BuildingViewModel;

	static from(serialized: DeliveryMessage, players, map: Map) {
		const delivery = new Delivery();
		delivery.id = serialized.id;
		delivery.assignee = players.find(player => player.id == serialized.assignee);
		delivery.source = map.buildings.find(building => building.id == serialized.source);
		delivery.destination = map.buildings.find(building => building.id == serialized.destination);

		return delivery;
	}

	toJSON(): DeliveryMessage {
		return {
			id: this.id,
			assignee: this.assignee.id,
			source: this.source.id,
			destination: this.destination.id,
			completed: this.completed
		};
	}
}