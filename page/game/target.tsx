import { Component } from "@acryps/page";
import { GameComponent } from ".";
import { Point } from "../../shared/point";

export class TargetTracker extends Component {
	declare parent: GameComponent;
	declare rootNode: HTMLElement;

	get target() {
		if (this.parent.player?.delivery) {
			if (this.parent.player.delivery.carrier == this.parent.player) {
				return this.parent.player.delivery.destination.center;
			}

			if (!this.parent.player.delivery.carrier && !this.parent.player.delivery.droppedLocation) {
				return this.parent.player.delivery.source.center;
			}
		}
	}

	updatePosition() {
		this.rootNode.style.setProperty('--player-color', this.parent.player?.color);

		if (this.target) {
			this.rootNode.setAttribute('ui-tracking', '');

			const angle = Math.atan2(
				(this.parent.mapRenderer.position.latitude - this.target.latitude) * this.parent.mapRenderer.scale.x,
				(this.parent.mapRenderer.position.longitude - this.target.longitude) * this.parent.mapRenderer.scale.y
			) - this.parent.direction;

			this.rootNode.style.left = `${this.parent.mapRenderer.width * this.parent.mapRenderer.playerViewLocation.x}px`;
			this.rootNode.style.top = `${this.parent.mapRenderer.height * this.parent.mapRenderer.playerViewLocation.y}px`;

			this.rootNode.style.transform = `rotate(${angle / Math.PI * 180}deg)`;
		} else {
			this.rootNode.removeAttribute('ui-tracking');
		}
	}

	render() {
		return <ui-void></ui-void> // <ui-tracker></ui-tracker>;
	}
}