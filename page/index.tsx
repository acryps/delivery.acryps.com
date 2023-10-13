import { Component, PathRouter, Router } from '@acryps/page';
import { registerDirectives } from '@acryps/page-default-directives';
import { PageComponent } from './page';
import { HomeComponent } from './home';
import { GameComponent } from './game';
import { JoinComponent } from './join';
import { CreateGameComponent } from './create';
import { Point } from '../shared/point';

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

		const start = new Point(47.38468034073662, 8.53153377949949);
		const end = start.walk(Math.PI / 3, 1491);

		console.debug(`https://www.google.com/maps/place/${end.latitude},+${end.longitude}/@${end.latitude},${end.longitude}`, start.distance(end), end.distance(start));
	}
}

Application.main();