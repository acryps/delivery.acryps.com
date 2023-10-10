import { Component } from "@acryps/page";
import { Point } from "./map";

export class GameComponent extends Component {
	center: Point;
	radius = 0.1;
	resolution = 0.0001;

	render() {
		

		return <ui-game>
			{mapCanvas}
		</ui-game>;
	}
}