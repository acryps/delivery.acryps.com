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
			<ui-invite>
				<ui-token>
					{this.parent.parameters.token}
				</ui-token>

				{qrCodeImage}
			</ui-invite>

			<ui-players>
				{this.parent.players.map((player, playerIndex) => <ui-player style={`--color: ${player.color}`}>
					<ui-name>{player.name}</ui-name>
					{playerIndex == 0 && <ui-host>Host</ui-host>}
				</ui-player>)}
			</ui-players>

			{this.parent.isHost
			? <ui-action ui-start ui-click={event => {
				this.parent.socket.send(JSON.stringify({
					start: true
				}));

				const element = (event.target as HTMLElement);
				element.innerText = 'Starting ...';
				element.setAttribute('ui-click-pending', '');
			}}>
				Start Game
			</ui-action>
			: <ui-action ui-info>Waiting for host ...</ui-action>}

			<ui-action ui-leave ui-href='/'>Leave</ui-action>
		</ui-lobby>;
	}
}