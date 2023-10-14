import { Component } from "@acryps/page";
import { Point } from "../shared/point";

export class HomeComponent extends Component {
	default = new Point(47.3731429, 8.5239003);

	render() {
		return <ui-home>
			<ui-action ui-join-game ui-href='/join'>
				Join Game
			</ui-action>

			<ui-action ui-create-game ui-click-text='Prepare hosting ...' ui-click={async () => {
				const location = await this.getCurrentLocation();

				this.navigate(`/create/${location.latitude}/${location.longitude}`);
			}}>
				Host Game
			</ui-action>
		</ui-home>
	}

	async getCurrentLocation() {
		if ('permissions' in navigator) {
			const permission = await navigator.permissions.query({ name: 'geolocation' });

			if (permission.state != 'granted') {
				return this.default;
			}
		}

		if ('geolocation' in navigator) {
			return new Promise<Point>(done => {
				navigator.geolocation.getCurrentPosition(position => {
					done(new Point(position.coords.latitude, position.coords.longitude));
				}, () => {
					done(this.default);
				});
			});
		}

		return this.default;
	}
}