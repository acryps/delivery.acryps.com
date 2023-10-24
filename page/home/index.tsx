import { Component } from "@acryps/page";
import { Point } from "../../shared/point";
import { tokenLength } from "../../shared/constants";
import { CreateGameComponent } from "./create";

export class HomeComponent extends Component {
	private token = '';
	private invalidToken = false;

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
		return <ui-home>
			<ui-section>
				<ui-title>
					Spiel Beitreten
				</ui-title>

				<ui-join>
					<input $ui-value={this.token} maxlength={tokenLength} placeholder='Code' ui-error={this.invalidToken} />

					<ui-action ui-join ui-click-text='Joining...' ui-click={async () => {
						if (this.token.length == tokenLength) {
							this.join();
						} else {
							this.invalidToken = true;

							this.update();
						}
					}}>
						Beitreten
					</ui-action>
				</ui-join>
			</ui-section>

			<ui-panel>
				<ui-title>
					Spiel Erstellen
				</ui-title>

				{new CreateGameComponent()}
			</ui-panel>
		</ui-home>
	}
}