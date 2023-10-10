import { DbContext } from "./managed/database";
import { DbClient, RunContext } from "vlquery";
import { registerInterface } from "./interface";
import { join } from "path";

const express = require('express');
const webSockets = require('express-ws');

DbClient.connectedClient = new DbClient({});

DbClient.connectedClient.connect().then(async () => {
	const app = express();
	webSockets(app);

	const database = new DbContext(new RunContext());

	registerInterface(app, database);

	app.use(express.static(join(process.cwd(), '..', 'page', 'built')));

	app.get('*', (req, res) => {
		res.sendFile(join(process.cwd(), '..', 'page', 'built', 'index.html'));
	});

	app.listen(+process.env.PORT! || 5407);
});