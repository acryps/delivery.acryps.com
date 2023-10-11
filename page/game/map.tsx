import { Component } from "@acryps/page";
import { GameComponent } from ".";
import { Point } from "../../shared/point";
import { move } from "../../shared/move";
import { Building } from "./building";
import { Rectangle } from "../../shared/rectangle";

export class MapComponent extends Component {
	declare parent: GameComponent;

	playerViewLocation = { x: 0.5, y: 0.9 };

	width: number;
	height: number;

	scale = { x: 500000, y: 350000 };
	
	buildings: Building[];
	waterBodies;
	streets;

	center: Point;
	radius: number;

	position: Point;
	direction = 0.2;

	renderedRotation = 0;

	lastFrame = new Date();

	async onload() {
		const objects = await fetch(`/map/${this.parent.parameters.token}`).then(response => response.json());

		this.buildings = objects.buildings.map(building => Building.from(building));
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
					angle: Math.atan2(
						this.width * this.playerViewLocation.x - event.touches[0].clientX, 
						this.height * this.playerViewLocation.y - event.touches[0].clientY
					)
				};

				this.parent.socket.send(JSON.stringify({ moveAngle: this.direction }));
			};

			mapCanvas.ontouchmove = event => {
				event.preventDefault();

				this.direction = startTouch.direction + startTouch.angle - Math.atan2(
					this.width * this.playerViewLocation.x - event.touches[0].clientX, 
					this.height * this.playerViewLocation.y - event.touches[0].clientY
				);

				this.parent.socket.send(JSON.stringify({ moveAngle: this.direction }));
			};

			mapCanvas.ontouchend = mapCanvas.ontouchcancel = () => {
				this.parent.socket.send(JSON.stringify({ moveAngle: null }));
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
		const deltaTime = +now - +this.lastFrame;
		this.lastFrame = now;

		// set context rotation
		context.rotate(this.direction - this.renderedRotation);
		this.renderedRotation = this.direction;

		// prepare frame
		context.beginPath();

		for (let building of this.visibleBuildings) {
			for (let pointIndex = 0; pointIndex < building.geometry.length; pointIndex++) {
				if (pointIndex == 0) {
					context.moveTo(...this.transform(building.geometry[pointIndex]));
				} else {
					context.lineTo(...this.transform(building.geometry[pointIndex]));
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

		context.fillStyle = '#8884';
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

	get viewport() {
		return Rectangle.fromCenter(this.position, 0.0025, 0.0025);
	}

	get visibleBuildings() {
		const viewport = this.viewport;
		const buildings = this.buildings.filter(building => viewport.touches(building.boundingBox));

		console.log('drew', buildings.length);

		return buildings;
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