import { Component } from "@acryps/page";

export class StatusComponent extends Component {
	message: string;

	show(message: string) {
		
	}

	render() {
		return <ui-status>
			{this.message}
		</ui-status>;
	}
}