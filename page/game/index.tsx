import { Component } from "@acryps/page";
import { MapComponent, Point } from "./map";
import { LobbyComponent } from "./lobby";

export class GameComponent extends Component {
	declare parameters: { token };

	map: MapComponent;
	lobby // = new LobbyComponent();

	socket: WebSocket;

	async onload() {
		this.socket = new WebSocket(`${location.protocol.replace('http', 'ws')}//${location.host}/join/${this.parameters.token}`);
	}

	render() {
		this.map = new MapComponent(new Point(0, 0), new Point(0.001, 0.001), 0.01);

		return <ui-game>
			{this.lobby}

			{this.map}
		</ui-game>;
	}
}