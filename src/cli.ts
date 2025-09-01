#!/usr/bin/env node

import path from "node:path";
import { poopgen } from "poopgen";
import chalk from "chalk";

try {
	await poopgen({
		// when testing create-mint in development, we will always gen the output to this directory that is not tracked by git.
		templatePath: path.join(import.meta.dirname, "../template"),
		destPath: process.env.NODE_ENV === "development" ? "./dest" : ".",
	});
} catch (err) {
	console.log(chalk.red("An unknown error has occurred"));
	console.log(err);

	process.exit(1);
}

process.exit(0);
