import { Component } from "@acryps/page";

export class JoinComponent extends Component {
	private token: string = '';
	private invalidToken: boolean = false;

	async join() {
		const gameExists = await fetch(`/game/${this.token}`).then(response => response.json());

		if (gameExists) {
			this.navigate(`/play/${this.token}`);
		} else {
			this.invalidToken = true;

			this.update();
		}
	}

	render() {
		return <ui-join>
			<input $ui-value={this.token} maxlength='6' placeholder='Token' ui-error={this.invalidToken} />
			{this.invalidToken && <ui-error-message>Game does not exist</ui-error-message>}

			<ui-action ui-create-game ui-click={() => this.join()}>
				Join
			</ui-action>
		</ui-join>
	}
}