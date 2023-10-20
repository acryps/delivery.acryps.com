import { Component } from "@acryps/page";
import { gameConfiguration } from "../shared/constants";

export class CreateGameComponent extends Component {
	declare parameters: {
		latitude,
		longitude
	}

	radius = gameConfiguration.radii[gameConfiguration.defaultRadiusIndex];
	duration = gameConfiguration.durationMinutes[gameConfiguration.defaultDurationIndex];

	render() {
		return <ui-create-game>
			<ui-location>
				<ui-title>
					Location
				</ui-title>

				{this.parameters.latitude} {this.parameters.longitude}
			</ui-location>

			<ui-radii>
				<ui-title>
					Radius
				</ui-title>

				{gameConfiguration.radii.map(radius => <ui-radius ui-active={radius == this.radius} ui-click={() => {
					this.radius = radius;

					this.update();
				}}>
					+/- {radius}
				</ui-radius>)}
			</ui-radii>

			<ui-durations>
				<ui-title>
					Duration
				</ui-title>

				{gameConfiguration.durationMinutes.map(duration => <ui-duration ui-active={duration == this.duration} ui-click={() => {
					this.duration = duration;

					this.update();
				}}>
					{duration}'
				</ui-duration>)}
			</ui-durations>

			<ui-action ui-create ui-click-text='Preparing Game...' ui-click={async () => {
				const token = await fetch('/game', {
					method: 'post',
					headers: {
						'content-type': 'application/json'
					},
					body: JSON.stringify({
						center: {
							latitude: +this.parameters.latitude,
							longitude: +this.parameters.longitude
						},
						radius: this.radius,
						duration: this.duration
					})
				}).then(response => response.json());

				this.navigate(`/play/${token}`);
			}}>
				Create Game
			</ui-action>

			<ui-action ui-back ui-click={() => this.navigate('/')}>Back</ui-action>
		</ui-create-game>;
	}
}