import { Component } from "@acryps/page";
import { GameComponent } from ".";

export class DeliveryIndicator extends Component {
	declare parent: GameComponent;

	render() {
		if (this.parent.delivery) {
			return <ui-delivery>
				<ui-source>
					{this.parent.delivery.source}
				</ui-source>

				<ui-destination>
					{this.parent.delivery.destination}
				</ui-destination>
			</ui-delivery>
		}

		return <ui-delivery ui-pick-up>
			Pick up Package
		</ui-delivery>
	}
}