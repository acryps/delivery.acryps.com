export class RenderStyle {
	private stroke: {
		size: number,
		color: string
	}

	private fill: string;

	constructor(name: string, source: CSSStyleDeclaration) {
		this.stroke = {
			size: +source.getPropertyValue(`--${name}-stroke-size`),
			color: source.getPropertyValue(`--${name}-stroke-color`)
		}

		this.fill = source.getPropertyValue(`--${name}-fill-color`);
	}

	apply(context: CanvasRenderingContext2D) {
		context.fillStyle = this.fill;
		context.strokeStyle = this.stroke.color;
		context.lineWidth = this.stroke.size;
	}

	render(context: CanvasRenderingContext2D, path?: Path2D) {
		this.apply(context);

		if (path) {
			context.stroke(path);
			context.fill(path);
		} else {
			context.stroke();
			context.fill();
		}
	}
}