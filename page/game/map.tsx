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

	playerViewLocation = { x: 0.5, y: 0.9 };

	width: number;
	height: number;

	scale = { x: 500000, y: 300000 };
	
	buildings;
	waterBodies;
	streets;

	center: Point;
	radius: number;

	position: Point;
	direction = 0.2;

	renderedRotation = 0;
	renderTime = new Date();

	async onload() {
		const objects = await fetch(`/map/${this.parent.parameters.token}`).then(response => response.json());

		this.buildings = objects.buildings;
		this.waterBodies = objects.waterBodies;
		this.streets = objects.streets;

		this.center = new Point(objects.center.latitude, objects.center.longitude);
		this.radius = objects.radius;

		this.position = new Point(this.center.latitude, this.center.longitude);
	}

	render() {
		const mapCanvas = document.createElement('canvas');

		requestAnimationFrame(() => {
			this.width = mapCanvas.width = mapCanvas.clientWidth;
			this.height = mapCanvas.height = mapCanvas.clientHeight;

			let startTouch;
			
			mapCanvas.ontouchstart = event => {
				startTouch = {
					direction: this.direction,
					
					//angle: -Math.atan2(
					//	this.width * this.playerViewLocation.x - event.touches[0].clientX, 
					//	this.height * this.playerViewLocation.y - event.touches[0].clientY
					//)

					// x: event.touches[0].clientX,
					// y: event.touches[0].clientY
				};
			};

			mapCanvas.ontouchmove = event => {
				const endTouchPosition = {
					x: event.touches[0].clientX,
					y: event.touches[0].clientY
				};

				this.direction = -Math.atan2(
					this.width * this.playerViewLocation.x - endTouchPosition.x, 
					this.height * this.playerViewLocation.y - endTouchPosition.y
				)// - startTouch.angle;

				console.log(this.direction);
			};

			mapCanvas.ontouchend = mapCanvas.ontouchcancel = () => {
				// send stop roate to server
			};

			const context = mapCanvas.getContext('2d');

			// center to player view
			context.translate(this.width * this.playerViewLocation.x, this.height * this.playerViewLocation.y);

			this.renderFrame(context);
		});

		return <ui-map>
			{mapCanvas}
		</ui-map>
	}

	renderFrame(context: CanvasRenderingContext2D) {
		const now = new Date();
		console.log(`${+now - +this.renderTime}ms`);
		this.renderTime = now;

		// set context rotation
		context.rotate(this.direction - this.renderedRotation);
		this.renderedRotation = this.direction;

		// prepare frame
		context.beginPath();

		for (let building of this.buildings) {
			for (let pointIndex = 0; pointIndex < building.geometry.length; pointIndex++) {
				const components = building.geometry[pointIndex].split(',');

				const point = new Point(+components[0], +components[1]);

				if (pointIndex == 0) {
					context.moveTo(...this.transform(point));
				} else {
					context.lineTo(...this.transform(point));
				}
			}

			context.closePath();
		}

		// clear last frame
		context.save();
		context.resetTransform();
		context.clearRect(0, 0, this.width, this.height);
		context.restore();

		// draw frame
		context.strokeStyle = 'white';
		context.stroke();

		context.fillStyle = '#222';
		context.fill();

		// render player
		const playerSize = 25;
		const playerPosition = this.transform(this.position);

		context.fillStyle = '#f00';
		context.beginPath();
		context.arc(playerPosition[0], playerPosition[1], playerSize / 2, 0, Math.PI * 2);
		context.fill();

		requestAnimationFrame(() => {
			if (this.parent.loaded) {
				this.renderFrame(context);
			}
		});
	}

	transform(point: Point): [number, number] {
		let x = point.latitude;
		let y = point.longitude;

		// move everything to the current maps location
		x -= this.position.latitude;
		y -= this.position.longitude;

		// scale to viewport
		x *= this.scale.x;
		y *= this.scale.y;

		return [x, y];
	}
}