import { Component, PathRouter, Router } from '@acryps/page';
import { registerDirectives } from '@acryps/page-default-directives';
import { PageComponent } from './page';
import { HomeComponent } from './home';
import { GameComponent } from './game';
import { JoinComponent } from './join';
import { CreateGameComponent } from './create';

export class Application {
	static router: Router;

	static async main() {
		this.router = new PathRouter(PageComponent
			.route('/', HomeComponent)
			.route('/join', JoinComponent)
			.route('/create/:latitude/:longitude', CreateGameComponent)

			.route('/play/:token', GameComponent)
		);
		
		registerDirectives(Component, this.router);

		this.router.host(document.body);
	}
}

Application.main();