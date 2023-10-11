import { Component } from "@acryps/page";
import { toDataURL } from 'qrcode';
import { GameComponent } from ".";

export class LobbyComponent extends Component {
	declare parent: GameComponent;

	render() {
		let qrCodeImage = new Image();

		requestAnimationFrame(async () => {
			qrCodeImage.src = await toDataURL(`${location.protocol}//${location.host}/play/${this.parent.parameters.token}`, {
				margin: 0
			});
		});

		return <ui-lobby>
			<ui-join>
				<ui-token>
					{this.parent.parameters.token}
				</ui-token>

				{qrCodeImage}
			</ui-join>

			<ui-players>
				{this.parent.players.map(player => <ui-player>
					{player.id}
				</ui-player>)}
			</ui-players>

			<ui-action ui-start ui-click={() => {
				this.parent.socket.send(JSON.stringify({
					start: true
				}));

				this.remove();
			}}>
				Start Game
			</ui-action>
		</ui-lobby>;
	}
}