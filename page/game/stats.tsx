import { Component } from "@acryps/page";
import { GameComponent } from ".";

export class StatsComponent extends Component {
	declare parent: GameComponent;

	private countdownSeconds: number = 0;
	private countdownInterval: number;
	
	get minutes() {
		return(Math.floor(this.countdownSeconds / 60) + '').padStart(2, '0');
	}

	get seconds() {
		return (this.countdownSeconds % 60 + '').padStart(2, '0');
	}

	startCountdown(durationMinutes: number) {
		if (this.countdownInterval) {
			clearInterval(this.countdownInterval);
		}

		this.countdownSeconds = durationMinutes * 60;
		this.update();

		this.countdownInterval = setInterval(() => {
			this.countdownSeconds--;
			this.update();

			if (this.countdownSeconds == 0) {
				clearInterval(this.countdownInterval);
				this.countdownInterval = null;
			}
		}, 1000);
	}

	render() {
		return <ui-stats>
			<ui-timer>{this.minutes}:{this.seconds}</ui-timer>

			{this.parent.player && <ui-score>
				<ui-current>{this.parent.player.score}</ui-current>
				<ui-delivery-worth>{this.parent.player.delivery?.carrier ? `+${this.parent.player.delivery.worth}` : ''}</ui-delivery-worth>
			</ui-score>}
		</ui-stats>;
	}
}