import { Component } from "@acryps/page";
import { GameComponent } from ".";

export class Point {
	constructor(
		public latitude: number,
		public longitude: number
	) {}
}

export class MapComponent extends Component {
	declare parent: GameComponent;

	resolution = 0.00001;
	
	buildings;
	waterBodies;
	streets;

	constructor(
		private position: Point,
		private center: Point,
		private radius: number
	) {
		super();
	}

	async onload() {
		const objects = await fetch(`/map/${this.parent.parameters.token}`).then(response => response.json());

		this.buildings = objects.buildings;
		this.waterBodies = objects.waterBodies;
		this.streets = objects.streets;
	}

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

		return <ui-map>
			{mapCanvas}
		</ui-map>
	}
}