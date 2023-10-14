import { Component } from "@acryps/page";
import { tokenLength } from "../shared/constants";

export class JoinComponent extends Component {
	private token: string = '';
	private invalidToken: boolean = false;

	async join() {
		const joinableGame = await fetch(`/game/${this.token}`).then(response => response.json());

		if (joinableGame) {
			this.navigate(`/play/${this.token}`);
		} else {
			this.invalidToken = true;

			this.update();
		}
	}

	render() {
		return <ui-join>
			<input $ui-value={this.token} maxlength={tokenLength} placeholder='Token' ui-error={this.invalidToken} />

			<ui-action ui-join ui-click-text='Joining...' ui-click={async () => this.token.length && this.join()}>
				Join
			</ui-action>

			<ui-action ui-back ui-click={() => this.navigate('/')}>Back</ui-action>
		</ui-join>
	}
}