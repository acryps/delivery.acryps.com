import { Component } from "@acryps/page";
import { GameComponent } from ".";
import { Point } from "../../shared/point";
import { Rectangle } from "../../shared/rectangle";

export class MapComponent extends Component {
	declare parent: GameComponent;

	static readonly playerSize = 20;
	static readonly notchSize = 4;

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

				this.parent.socket.send(JSON.stringify({ moveAngle: Math.PI - this.parent.direction + Math.PI / 2 }));
			};

			mapCanvas.ontouchmove = event => {
				event.preventDefault();

				this.parent.direction = startTouch.direction + startTouch.angle - Math.atan2(
					this.width * this.playerViewLocation.x - event.touches[0].clientX, 
					this.height * this.playerViewLocation.y - event.touches[0].clientY
				);

				this.parent.socket.send(JSON.stringify({ moveAngle: Math.PI - this.parent.direction + Math.PI / 2 }));
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
		this.parent.targetTracker.updatePosition();

		const now = new Date();
		const deltaTime = +now - +this.lastFrame;
		this.lastFrame = now;

		// set context rotation
		context.rotate(this.parent.direction - this.renderedRotation);
		this.renderedRotation = this.parent.direction;

		// prepare frame
		const buildingsPath = new Path2D();
		const packageSourcePath = new Path2D();

		for (let building of this.visibleBuildings) {
			let path = buildingsPath;
			
			if (this.parent.player?.delivery) {
				if (building == this.parent.player.delivery.source) {
					if (!this.parent.player.delivery.carrier) {
						path = packageSourcePath;
					}
				}

				if (building == this.parent.player.delivery.destination) {
					path = packageSourcePath;
				}
			}

			for (let pointIndex = 0; pointIndex < building.geometry.length; pointIndex++) {
				if (pointIndex == 0) {
					path.moveTo(...this.transform(building.geometry[pointIndex]));
				} else {
					path.lineTo(...this.transform(building.geometry[pointIndex]));
				}
			}

			context.closePath();
		}

		// clear last frame
		context.save();
		context.resetTransform();
		context.clearRect(0, 0, this.width, this.height);
		context.restore();

		// create playing field
		context.fillStyle = '#000';

		const topLeft = this.transform(this.parent.map.boundingBox.topLeft);
		const bottomRight = this.transform(this.parent.map.boundingBox.bottomRight);

		context.fillRect(...topLeft, bottomRight[0] - topLeft[0], bottomRight[1] - topLeft[1]);

		// draw frame
		context.lineWidth = 1;

		context.strokeStyle = 'white';
		context.stroke(buildingsPath);

		context.fillStyle = '#8884';
		context.fill(buildingsPath);

		context.fillStyle = this.parent.player?.color;
		context.stroke(packageSourcePath);
		context.fill(packageSourcePath);

		// render player
		context.lineWidth = MapComponent.notchSize;

		for (let player of this.parent.players) {
			const carrying = player.delivery && player.delivery.carrier == player;
			let size = MapComponent.playerSize / 2;

			if (carrying) {
				size += MapComponent.notchSize / 2;
			}

			context.fillStyle = player.color;
			context.beginPath();
			context.arc(...this.transform(player.position), size, 0, Math.PI * 2);
			context.fill();

			if (carrying) {
				context.stroke();
			}
		}

		if (this.parent.player && this.parent.player.delivery?.carrier == this.parent.player) {
			const start = this.parent.player.delivery.source.center;

			this.parent.deliveryIndicator?.updateDistance(
				start.distance(this.parent.player.delivery.destination.center),
				start.distance(this.parent.player.position)
			);
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
		const buildings = this.parent.map.buildings.filter(building => viewport.touches(building.boundingBox));

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