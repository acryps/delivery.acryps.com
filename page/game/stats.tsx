import { Component } from "@acryps/page";
import { GameComponent } from ".";

import crown from 'url:../assets/crown.svg';

export class StatsComponent extends Component {
	declare parent: GameComponent;

	render() {
		return <ui-stats>
			<ui-timer>00:00</ui-timer>

			{this.parent.player && <ui-score>
				{this.parent.hasHighscore && <img src={crown} />}
				<ui-current>{this.parent.player.score}</ui-current>
				<ui-delivery>{this.parent.player.delivery?.carrier ? `+${this.parent.player.delivery.worth}` : ''}</ui-delivery>
			</ui-score>}
		</ui-stats>;
	}
}