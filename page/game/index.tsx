import { Component } from "@acryps/page";
import { MapComponent } from "./map";
import { LobbyComponent } from "./lobby";
import { DeliveryIndicator } from "./delivery";

export class GameComponent extends Component {
	declare parameters: { token };

	id: string;
	players = [];

	map: MapComponent;
	lobby = new LobbyComponent();
	deliveryIndicator = new DeliveryIndicator();

	socket: WebSocket;


	async onload() {
		this.socket = new WebSocket(`${location.protocol.replace('http', 'ws')}//${location.host}/join/${this.parameters.token}`);
		this.socket.onclose = () => this.navigate('/');

		this.socket.onmessage = event => {
			const join = JSON.parse(event.data);
			this.id = join.id;
			this.players = join.peers;

			this.socket.onmessage = event => {
				const data = JSON.parse(event.data);

				if ('join' in data) {
					this.players.push(data.join);

					this.lobby.update();
				}

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
			{this.map}

			{this.deliveryIndicator}

			{this.lobby}
		</ui-game>;
	}
}