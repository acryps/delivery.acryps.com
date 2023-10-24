import { Component } from '@acryps/page';

import logo from './assets/logo.svg';

export class PageComponent extends Component {
	render(child) {
		return <ui-page>
			<ui-navigation>
				<ui-container>
					<img src={logo} />
				</ui-container>
			</ui-navigation>

			{child}
		</ui-page>;
	}
}