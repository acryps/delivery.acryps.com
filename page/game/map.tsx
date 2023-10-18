import { Component } from "@acryps/page";
import { GameComponent } from ".";
import { Point } from "../../shared/point";
import { Rectangle } from "../../shared/rectangle";
import { RenderStyle } from "./style";
import { Railway } from "../../shared/railway";

import crown from "url:../assets/crown.svg";

export class MapComponent extends Component {
	declare parent: GameComponent;

	static readonly playerSize = 20;

	playerViewLocation = { x: 0.5, y: 0.9 };

	realMapHeight = 150; // meters

	width: number;
	height: number;
	scale: number;
	
	renderedRotation = 0;

	lastFrame = new Date();

	buildingStyle: RenderStyle;
	mapStyle: RenderStyle;
	notchStyle: RenderStyle;
	railwayGravelStyle: RenderStyle;
	railwayRailStyle: RenderStyle;

	private crownImage: HTMLImageElement;

	get position() {
		return this.parent.player?.position ?? this.parent.center;
	}

	render() {
		const mapCanvas = document.createElement('canvas');

		// load resources before drawing
		this.crownImage = new Image();

		this.crownImage.onload = () => {
			this.startRenderAnimation(mapCanvas);
		}

		this.crownImage.src = crown;

		return <ui-map>
			{mapCanvas}
		</ui-map>
	}

	private startRenderAnimation(mapCanvas: HTMLCanvasElement) {
		requestAnimationFrame(() => {
			this.width = mapCanvas.width = mapCanvas.clientWidth;
			this.height = mapCanvas.height = mapCanvas.clientHeight;

			this.scale = this.height / this.realMapHeight;

			let startTouch;

			const style = getComputedStyle(mapCanvas);

			this.buildingStyle = new RenderStyle('building', style);
			this.mapStyle = new RenderStyle('map', style);
			this.notchStyle = new RenderStyle('notch', style);
			this.railwayGravelStyle = new RenderStyle('railway-gravel', style);
			this.railwayRailStyle = new RenderStyle('railway-rail', style);
			
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
	}

	private renderFrame(context: CanvasRenderingContext2D) {
		const now = new Date();
		const deltaTime = +now - +this.lastFrame;
		this.lastFrame = now;

		// set context rotation
		context.rotate(this.parent.direction - this.renderedRotation);
		this.renderedRotation = this.parent.direction;

		// prepare frame
		const trackGravelPaths = new Map<number, Path2D>();

		for (let railway of this.visibleRailways) {
			let path = trackGravelPaths.get(railway.gauge);

			if (!path) {
				path = new Path2D();

				trackGravelPaths.set(railway.gauge, path);
			}

			for (let pathIndex = 0; pathIndex < railway.path.length; pathIndex++) {
				if (pathIndex == 0) {
					path.moveTo(...this.transform(railway.path[pathIndex]));
				} else {
					path.lineTo(...this.transform(railway.path[pathIndex]));
				}
			}
		}

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
		const topLeft = this.transform(this.parent.map.boundingBox.topLeft);
		const bottomRight = this.transform(this.parent.map.boundingBox.bottomRight);

		context.beginPath();
		context.rect(...topLeft, bottomRight[0] - topLeft[0], bottomRight[1] - topLeft[1]);

		this.mapStyle.render(context);

		this.railwayGravelStyle.apply(context);

		// render railways
		for (let [gauge, path] of trackGravelPaths) {
			const lineWidth = (gauge / 1000) * this.scale;

			// add track bed
			context.lineWidth = lineWidth + Railway.padding * 2 * this.scale;
			context.stroke(path);

			// add rails
			this.railwayRailStyle.apply(context);
			context.lineWidth = lineWidth + this.railwayRailStyle.stroke.size * 2;
			context.stroke(path);

			// add inner track bed
			this.railwayGravelStyle.apply(context); // will be reused by the next outer track bed
			context.lineWidth = lineWidth;
			context.stroke(path);
		}

		// draw buildings
		this.buildingStyle.render(context, buildingsPath);

		context.fillStyle = this.parent.player?.color;
		context.stroke(packageSourcePath);
		context.fill(packageSourcePath);

		// render player
		this.notchStyle.apply(context);

		for (let player of this.parent.players) {
			const carrying = player.delivery && player.delivery.carrier == player;
			let size = MapComponent.playerSize / 2;

			if (carrying) {
				size += this.notchStyle.stroke.size / 2;
			}

			context.fillStyle = player.color;
			context.beginPath();
			context.arc(...this.transform(player.position), size, 0, Math.PI * 2);
			context.fill();

			if (carrying) {
				context.stroke();
			}

			if (player.score == this.parent.highscore) {
				const crownPosition: [x: number, y:number] = this.transform(player.position);
				crownPosition[0] -= size;
				crownPosition[1] -= size * 2.5;

				const crownSize = size * 2;

				context.drawImage(this.crownImage, crownPosition[0], crownPosition[1], crownSize, crownSize);
			}
		}

		// update the direction tracker
		this.parent.targetTracker.updatePosition();

		// update the distance tracker
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
		
		return this.parent.map.buildings.filter(building => viewport.touches(building.boundingBox));
	}

	get visibleRailways() {
		const viewport = this.viewport;
		
		return this.parent.map.railways.filter(railway => viewport.touches(railway.boundingBox));
	}

	transform(point: Point): [number, number] {
		const angle = this.position.bearing(point);
		const distance = this.position.distance(point);

		return [
			Math.cos(angle) * distance * this.scale,
			Math.sin(angle) * distance * this.scale,
		];
	}
}