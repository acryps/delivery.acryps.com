import { Component } from "@acryps/page";
import { GameComponent } from ".";

export class StatsComponent extends Component {
	declare parent: GameComponent;

	render() {
		return <ui-stats>
			<ui-timer>00:00</ui-timer>

			{this.parent.player && <ui-score>
				<ui-current>{this.parent.player.score}</ui-current>
				<ui-delivery-worth>{this.parent.player.delivery?.carrier ? `+${this.parent.player.delivery.worth}` : ''}</ui-delivery-worth>
			</ui-score>}
		</ui-stats>;
	}
}