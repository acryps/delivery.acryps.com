import { Component } from "@acryps/page";
import { MapComponent, Point } from "./map";
import { LobbyComponent } from "./lobby";

export class GameComponent extends Component {
	declare parameters: { token };

	id: string;
	players = [];

	map: MapComponent;
	lobby = new LobbyComponent();

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

				console.log(this);

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
			{this.lobby}

			{this.map}
		</ui-game>;
	}
}