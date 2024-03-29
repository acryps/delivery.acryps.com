import { Component } from "@acryps/page";
import { gameConfiguration } from "../../shared/constants";
import { Point } from "../../shared/point";

export class CreateGameComponent extends Component {
	center = new Point(47.3731429, 8.5239003);

	positionPresets = [
		new LocationPreset('Acryps Zürich', new Point(47.3731429, 8.5239003)),
		new LocationPreset('Acryps Luzern', new Point(47.04981, 8.30086)),
		new LocationPreset('Niederdorf', new Point(47.37184, 8.54381)),
		new LocationPreset('London Marylebone', new Point(51.51901, 0.15836)),
		new LocationPreset('Luzern', new Point(47.05070, 8.30895))
	];

	radius = gameConfiguration.radii[gameConfiguration.defaultRadiusIndex];
	duration = gameConfiguration.durationMinutes[gameConfiguration.defaultDurationIndex];

	render() {
		return <ui-create-game>
			<ui-location>
				<ui-title>
					Ort
				</ui-title>

				<ui-form>
					<input type='number' $ui-value={this.center.latitude} />
					<input type='number' $ui-value={this.center.longitude} />
				</ui-form>

				<ui-presets>
					<ui-action ui-current-location ui-click={async () => {
						const position = await this.getCurrentLocation();

						if (position) {
							this.center = position;

							this.update();
						}
					}}>
						Dein Standort
					</ui-action>

					{this.positionPresets.map(preset => <ui-action ui-preset ui-click={() => {
						this.center = preset.location;

						this.update();
					}}>
						{preset.name}
					</ui-action>)}
				</ui-presets>
			</ui-location>

			<ui-radius>
				<ui-title>
					Spielfeld
				</ui-title>

				<ui-radii>
					{gameConfiguration.radii.map(radius => <ui-radius ui-active={radius == this.radius} ui-click={() => {
						this.radius = radius;

						this.update();
					}}>
						{radius * 2}m
					</ui-radius>)}
				</ui-radii>
			</ui-radius>

			<ui-duration>
				<ui-title>
					Spielzeit
				</ui-title>

				<ui-durations>
					{gameConfiguration.durationMinutes.map(duration => <ui-duration ui-active={duration == this.duration} ui-click={() => {
						this.duration = duration;

						this.update();
					}}>
						{duration}'
					</ui-duration>)}
				</ui-durations>
			</ui-duration>

			<ui-action ui-create ui-click-text='Preparing Game...' ui-click={async () => {
				const token = await fetch('/game', {
					method: 'post',
					headers: {
						'content-type': 'application/json'
					},
					body: JSON.stringify({
						center: {
							latitude: +this.center.latitude,
							longitude: +this.center.longitude
						},
						radius: this.radius,
						duration: this.duration
					})
				}).then(response => response.json());

				this.navigate(`/play/${token}`);
			}}>
				Create Game
			</ui-action>
		</ui-create-game>;
	}

	async getCurrentLocation() {
		if ('permissions' in navigator) {
			const permission = await navigator.permissions.query({ name: 'geolocation' });

			if (permission.state != 'granted') {
				return;
			}
		}

		if ('geolocation' in navigator) {
			return new Promise<Point>(done => {
				navigator.geolocation.getCurrentPosition(position => {
					done(new Point(position.coords.latitude, position.coords.longitude));
				}, () => {
					done(null);
				});
			});
		}
	}
}

export class LocationPreset {
	constructor(
		public name: string,
		public location: Point
	) {}
}