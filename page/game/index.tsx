import { Component } from "@acryps/page";
import { Point } from "./map";

export class GameComponent extends Component {
	center: Point;
	radius = 0.1;
	resolution = 0.0001;

	render() {
		const mapCanvas = document.createElement('canvas');

		requestAnimationFrame(() => {
			const size = mapCanvas.width = mapCanvas.height = Math.round((this.radius * 2) / this.resolution);
			console.debug(size)
			
			const context = mapCanvas.getContext('2d');
			context.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
			context.fillStyle = 'red';
			context.fill();
		});

		return <ui-game>
			{mapCanvas}
		</ui-game>;
	}
}