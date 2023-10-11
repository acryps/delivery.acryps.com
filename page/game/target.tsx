import { Component } from "@acryps/page";
import { GameComponent } from ".";
import { Point } from "../../shared/point";

export class TargetTracker extends Component {
	declare parent: GameComponent;
	declare rootNode: HTMLElement;

	target: Point;

	updatePosition() {
		if (this.target) {
			this.rootNode.setAttribute('ui-tracking', '');

			const angle = ((Math.atan2(
				this.parent.map.position.latitude - this.target.latitude,
				this.parent.map.position.longitude - this.target.longitude
			) + this.parent.direction) % (Math.PI * 2)) + (Math.PI * 2)) % (Math.PI * 2);

			this.rootNode.style.left = `${this.parent.map.width * this.parent.map.playerViewLocation.x}px`;
			this.rootNode.style.top = `${this.parent.map.height * this.parent.map.playerViewLocation.y}px`;

			this.rootNode.style.transform = `rotate(${angle / Math.PI * 180}deg)`;
		} else {
			console.debug('no traget', this);

			this.rootNode.removeAttribute('ui-tracking');
		}
	}

	render() {
		return <ui-tracker></ui-tracker>;
	}
}