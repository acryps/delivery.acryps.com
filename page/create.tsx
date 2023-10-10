import { Component } from "@acryps/page";

export class CreateGameComponent extends Component {
	declare parameters: {
		latitude,
		longitude
	}

	radii = [0.001, 0.002, 0.005];
	radius = this.radii[1];

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

				{this.radii.map(radius => <ui-radius ui-active={radius == this.radius} ui-click={() => {
					this.radius = radius;

					this.update();
				}}>
					+/- {radius}
				</ui-radius>)}
			</ui-radii>

			<ui-action ui-start ui-click={async () => {
				const token = await fetch('/game', {
					method: 'post',
					headers: {
						'content-type': 'application/json'
					},
					body: JSON.stringify({
						center: {
							latitude: this.parameters.latitude,
							longitude: this.parameters.longitude
						},
						radius: this.radius
					})
				}).then(response => response.json());

				this.navigate(`/play/${token}`);
			}}>
				Start Game
			</ui-action>
		</ui-create-game>;
	}
}