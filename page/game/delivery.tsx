import { Component } from "@acryps/page";
import { GameComponent } from ".";

export class DeliveryIndicator extends Component {
	declare parent: GameComponent;

	private progress: HTMLElement;

	updateDistance(full: number, current: number) {
		const ratio = Math.min(1 / full * current, 1);

		if (this.progress) {
			this.progress.style.setProperty('--progress', ratio.toString());
		}
	}

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

					{this.progress = <ui-progress></ui-progress>}
				</ui-delivery>;
			}

			return <ui-delivery>
				<ui-prompt>
					Pick up your package from
				</ui-prompt>

				<ui-location>
					{this.parent.player.delivery.source.address?.trim()}
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