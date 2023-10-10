import { Component } from "@acryps/page";
import { Point } from "./game/map";

export class HomeComponent extends Component {
	default = new Point(47.3731429, 8.5239003);

	render() {
		return <ui-home>
			<ui-action ui-join-game ui-href='/join'>
				Join Game
			</ui-action>

			<ui-action ui-create-game ui-click={async () => {
				if ('geolocation' in navigator) {
					navigator.geolocation.getCurrentPosition(position => {
						this.navigate(`/create/${position.coords.latitude}/${position.coords.longitude}`);
					}, () => {
						this.navigate(`/create/${this.default.latitude}/${this.default.longitude}`);
					});
				} else {
					this.navigate(`/create/${this.default.latitude}/${this.default.longitude}`);
				}
			}}>
				Create Game
			</ui-action>
		</ui-home>
	}
}