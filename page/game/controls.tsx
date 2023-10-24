export class Controls {
	static readonly forwardKey = 'w';
	static readonly leftKey = 'a';
	static readonly rightKey = 'd';

	static readonly keyboardRepeatingInterval = 1000 / 60;
	static readonly keyboardRotationSpeed = 0.05;

	constructor(
		private direction: number,
		private mapCanvas: HTMLCanvasElement,
		private playerMapPosition: { x, y },
		private document: Document,

		private onMove: (direction: number) => void,
		private onStop: () => void
	) {
		this.registerTouchEvents();
		this.registerMouseEvents();
	}

	private registerMouseEvents() {
		let forwardActive = false;
		let leftActive = false;
		let rightActive = false;

		setInterval(() => {
			if (leftActive) {
				this.direction += Controls.keyboardRotationSpeed;
			}

			if (rightActive) {
				this.direction -= Controls.keyboardRotationSpeed;
			}

			if (forwardActive || leftActive || rightActive) {
				this.onMove(this.direction);
			} else {
				this.onStop();
			}
		}, Controls.keyboardRepeatingInterval);

		this.document.onkeydown = event => {
			switch (event.key) {
				case Controls.forwardKey: {
					forwardActive = true;

					break;
				}

				case Controls.leftKey: {
					leftActive = true;

					break;
				}

				case Controls.rightKey: {
					rightActive = true;

					break;
				}
			}
		}

		this.document.onkeyup = event => {
			switch (event.key) {
				case Controls.forwardKey: {
					forwardActive = false;

					break;
				}

				case Controls.leftKey: {
					leftActive = false;

					break;
				}

				case Controls.rightKey: {
					rightActive = false;

					break;
				}
			}
		}
	}

	private registerTouchEvents() {
		let startTouch;

		const width = this.mapCanvas.width;
		const height = this.mapCanvas.height;

		this.mapCanvas.ontouchstart = event => {
			startTouch = {
				direction: this.direction,
				angle: Math.atan2(
					width * this.playerMapPosition.x - event.touches[0].clientX, 
					height * this.playerMapPosition.y - event.touches[0].clientY
				)
			};

			this.onMove(this.direction);
		};

		this.mapCanvas.ontouchmove = event => {
			event.preventDefault();

			this.direction = startTouch.direction + startTouch.angle - Math.atan2(
				width * this.playerMapPosition.x - event.touches[0].clientX, 
				height * this.playerMapPosition.y - event.touches[0].clientY
			);

			this.onMove(this.direction);
		};

		this.mapCanvas.ontouchend = this.mapCanvas.ontouchcancel = () => {
			this.onStop();
		};
	}
}