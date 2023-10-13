import { Component } from "@acryps/page";

export class JoinComponent extends Component {
	private readonly tokenLength = 6;

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
			<input $ui-value={this.token} maxlength={this.tokenLength} placeholder='Token' ui-error={this.invalidToken} />

			<ui-action ui-create-game ui-click={() => this.join()}>
				Join
			</ui-action>
		</ui-join>
	}
}