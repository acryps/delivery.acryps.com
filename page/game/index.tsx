import { Component } from "@acryps/page";
import { MapComponent, Point } from "./map";
import { LobbyComponent } from "./lobby";

export class GameComponent extends Component {
	declare parameters: { token };

	id: string;

	map: MapComponent;
	lobby = new LobbyComponent();

	socket: WebSocket;

	async onload() {
		this.socket = new WebSocket(`${location.protocol.replace('http', 'ws')}//${location.host}/join/${this.parameters.token}`);
		this.socket.onclose = () => this.navigate('/');

		this.socket.onmessage = event => {
			this.id = event.data;

			this.socket.onmessage = event => {
				const data = JSON.parse(event.data);

				console.debug(data);

				if ('move' in data) {
					for (let player of data.move) {
						if (player.id == this.id) {
							this.map.position = player.position;
						}
					}
				}
			};
		};
	}

	render() {
		this.map = new MapComponent();

		return <ui-game>
			{this.lobby}

			{this.map}
		</ui-game>;
	}
}