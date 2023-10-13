import { Component } from "@acryps/page";
import { GameComponent } from ".";

export class DeliveryIndicator extends Component {
	declare parent: GameComponent;

	render() {
		if (this.parent.player?.delivery) {
			if (this.parent.player.delivery.carrier) {
				return <ui-delivery>
					<ui-prompt>
						Deliver Your Package To
					</ui-prompt>

					<ui-location>
						{this.parent.player.delivery.destination.address.trim()}
					</ui-location>
				</ui-delivery>;
			}

			return <ui-delivery>
				<ui-prompt>
					Pick up your package from
				</ui-prompt>

				<ui-location>
					{this.parent.player.delivery.source.address.trim()}
				</ui-location>
			</ui-delivery>
		}

		return <ui-delivery>
			<ui-prompt>
				No delivery assigned
			</ui-prompt>
		</ui-delivery>;
	}
}