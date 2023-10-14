import { Component } from "@acryps/page";
import { GameComponent } from ".";
import { Point } from "../../shared/point";
import { MapComponent } from "./map";

export class TargetTracker extends Component {
	declare parent: GameComponent;
	declare rootNode: HTMLElement;

	get target() {
		if (this.parent.player?.delivery) {
			if (this.parent.player.delivery.carrier == this.parent.player) {
				return this.parent.player.delivery.destination.center;
			}

			if (!this.parent.player.delivery.carrier) {
				return this.parent.player.delivery.source.center;
			}
		}
	}

	updatePosition() {
		if (this.target) {
			this.rootNode.setAttribute('ui-tracking', '');

			const angle = Math.atan2(
				(this.target.longitude - this.parent.player.position.longitude),
				(this.target.latitude - this.parent.player.position.latitude)
			) + this.parent.direction;

			this.rootNode.style.setProperty('--angle', `${angle * (180 / Math.PI)}deg`);
		} else {
			this.rootNode.removeAttribute('ui-tracking');
		}
	}

	render() {
		return <ui-tracker style={`
			--player-size: ${MapComponent.playerSize}px;
			--offset-x: ${this.parent.mapRenderer.playerViewLocation.x};
			--offset-y: ${this.parent.mapRenderer.playerViewLocation.y};
		`}></ui-tracker>;
	}
}