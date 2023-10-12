import { Component } from "@acryps/page";
import { GameComponent } from ".";

export class DeliveryIndicator extends Component {
	declare parent: GameComponent;

	render() {
		if (this.parent.delivery) {
			return <ui-delivery>
				<ui-source>
					{this.parent.delivery.source.address.trim()}
				</ui-source>

				<ui-destination>
					{this.parent.delivery.destination.address.trim()}
				</ui-destination>
			</ui-delivery>
		}

		return <ui-delivery ui-pick-up>
			Pick up Package
		</ui-delivery>
	}
}