import { Component } from "@acryps/page";
import { Player } from "./player";

export class StatusComponent extends Component {
	message: (string | Node)[];

	removeTimer = setTimeout(() => {});

	show(...message: (string | Player)[]) {
		clearTimeout(this.removeTimer);

		this.message = message.map(part => {
			if (typeof part == 'string') {
				return part;
			}

			return <ui-player-name style={`--color: ${part.color}`}>
				{part.name}
			</ui-player-name>;
		});

		this.removeTimer = setTimeout(() => {
			delete this.message;

			this.update();
		}, 1500);

		this.update();
	}

	render() {
		return <ui-status>
			{this.message}
		</ui-status>;
	}
}