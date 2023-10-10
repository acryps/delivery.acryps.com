import { Component } from "@acryps/page";

export class HomeComponent extends Component {
	render() {
		return <ui-home>
			<ui-action ui-create-game>
				Create Game
			</ui-action>

			<ui-action ui-create-game>
				Join Game
			</ui-action>
		</ui-home>
	}
}