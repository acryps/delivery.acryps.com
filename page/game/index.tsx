import { Component } from "@acryps/page";
import { MapComponent } from "./map";
import { LobbyComponent } from "./lobby";
import { DeliveryIndicator } from "./delivery";
import { Player } from "./player";
import { ServerMessage } from "../../shared/messages";

export class GameComponent extends Component {
	declare parameters: { token };

	id: string;
	players: Player[] = [];

	map: MapComponent;
	lobby = new LobbyComponent();
	deliveryIndicator = new DeliveryIndicator();

	socket: WebSocket;

	get player() {
		return this.players.find(player => player.id == this.id);
	}

	async onload() {
		this.socket = new WebSocket(`${location.protocol.replace('http', 'ws')}//${location.host}/join/${this.parameters.token}`);
		this.socket.onclose = () => this.navigate('/');

		this.socket.onmessage = event => {
			const join = JSON.parse(event.data);
			this.id = join.id;
			this.players = join.peers.map(player => Player.from(player));

			this.socket.onmessage = event => {
				const data = JSON.parse(event.data) as ServerMessage;

				if ('join' in data) {
					this.players.push(Player.from(data.join));

					this.lobby.update();
				}

				if ('start' in data) {
					this.lobby.remove();
				}

				if ('move' in data) {
					for (let update of data.move) {
						const player = this.players.find(player => player.id == update.id);

						player.position = update.position;
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