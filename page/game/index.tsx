import { Component } from "@acryps/page";
import { MapComponent } from "./map";
import { LobbyComponent } from "./lobby";
import { DeliveryIndicator } from "./delivery";
import { Player } from "./player";
import { ServerMessage } from "../../shared/messages";
import { Point } from "../../shared/point";
import { TargetTracker } from "./target";
import { Delivery } from "../../shared/delivery";
import { Map } from "../../shared/map";

export class GameComponent extends Component {
	declare parameters: { token };
	declare rootNode: HTMLElement;

	id: string;
	players: Player[] = [];

	mapRenderer: MapComponent;
	lobby = new LobbyComponent();

	deliveryIndicator = new DeliveryIndicator();

	targetTracker = new TargetTracker();

	map: Map;

	center: Point;
	radius: number;

	direction = 0.2;

	socket: WebSocket;

	get player() {
		return this.players.find(player => player.id == this.id);
	}

	get isHost() {
		return this.players.findIndex(player => player.id == this.id) == 0;
	}

	onrouteleave() {
		this.socket.close();
	}

	async onload() {
		const map = await fetch(`/map/${this.parameters.token}`).then(response => response.json());

		if (!map) {
			this.navigate('/');
			return;
		}

		this.map = Map.from(map);
		this.center = new Point(this.map.center.latitude, this.map.center.longitude);
		this.radius = this.map.radius;

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

					this.rootNode.style.setProperty('--player-color', this.player.color);
					this.lobby.update();
				}

				if ('leave' in data) {
					const playerIndex = this.players.findIndex(player => player.id == Player.from(data.leave).id);
					this.players.splice(playerIndex, 1);

					this.lobby.update();
				}

				if ('start' in data) {
					this.lobby.remove();
				}

				if ('assigned' in data) {
					const player = this.players.find(player => player.id == data.assigned.assignee);
					player.delivery = Delivery.from(data.assigned, this.players, this.map);

					this.deliveryIndicator.update();
				}

				if ('pickedUp' in data) {
					const delivery = this.players.find(player => player.delivery?.id == data.pickedUp).delivery;
					delivery.carrier = delivery.assignee;

					this.deliveryIndicator.update();
				}

				if ('move' in data) {
					for (let update of data.move) {
						const player = this.players.find(player => player.id == update.id);

						player.position = update.position;
					}
				}

				if ('steal' in data) {
					const thief = this.players.find(player => player.id == data.steal.thief);
					const victim = this.players.find(player => player.id == data.steal.victim);

					thief.delivery = victim.delivery;
					this.deliveryIndicator.update();
				}
			};
		};
	}

	render() {
		this.mapRenderer = new MapComponent();

		return <ui-game>
			{this.mapRenderer}
			{this.targetTracker}

			{this.deliveryIndicator}

			{this.lobby}
		</ui-game>;
	}
}