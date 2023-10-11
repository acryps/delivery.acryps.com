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
	
	renderedRotation = 0;

	lastFrame = new Date();

	get position() {
		return this.parent.player?.position ?? this.parent.center;
	}

	render() {
		const mapCanvas = document.createElement('canvas');

		requestAnimationFrame(() => {
			this.width = mapCanvas.width = mapCanvas.clientWidth;
			this.height = mapCanvas.height = mapCanvas.clientHeight;

			let startTouch;
			
			mapCanvas.ontouchstart = event => {
				startTouch = {
					direction: this.parent.direction,
					angle: Math.atan2(
						this.width * this.playerViewLocation.x - event.touches[0].clientX, 
						this.height * this.playerViewLocation.y - event.touches[0].clientY
					)
				};

				this.parent.socket.send(JSON.stringify({ moveAngle: this.parent.direction }));
			};

			mapCanvas.ontouchmove = event => {
				event.preventDefault();

				this.parent.direction = startTouch.direction + startTouch.angle - Math.atan2(
					this.width * this.playerViewLocation.x - event.touches[0].clientX, 
					this.height * this.playerViewLocation.y - event.touches[0].clientY
				);

				this.parent.socket.send(JSON.stringify({ moveAngle: this.parent.direction }));
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
		context.rotate(this.parent.direction - this.renderedRotation);
		this.renderedRotation = this.parent.direction;

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

		for (let player of this.parent.players) {
			const playerPosition = this.transform(player.position);

			context.fillStyle = player.color;
			context.beginPath();
			context.arc(...playerPosition, playerSize / 2, 0, Math.PI * 2);
			context.fill();
		}

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
		const buildings = this.parent.buildings.filter(building => viewport.touches(building.boundingBox));

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