import { Component } from "@acryps/page";
import { GameComponent } from ".";

export class LobbyComponent extends Component {
	declare parent: GameComponent;

	render() {
		return <ui-lobby>
			<ui-action ui-start ui-click={() => {
				fetch('/start', {
					headers: {
						'content-type': 'application/json'
					},
					body: JSON.stringify({
						token: this.parent.parameters.token
					})
				})
			}}>
				Start Game
			</ui-action>
		</ui-lobby>;
	}
}