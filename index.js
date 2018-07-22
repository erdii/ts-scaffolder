#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const crossSpawn = require("cross-spawn");
const chalk = require("chalk");
const validateNpmPackageName = require("validate-npm-package-name");
const convict = require("convict");

const config = convict({
	isWebapp: {
		doc: "is this project a webapp or not?",
		format: Boolean,
		default: false,
		arg: "iswebapp",
		env: "ISWEBAPP",
	},
	umdName: {
		doc: "umd module name",
		format: String,
		default: "myApp",
		arg: "umdname",
		env: "UMDNAME",
	},
})

function asyncify(fn, ...args) {
	return new Promise((resolve, reject) => {
		fn(...args, function(err, result) {
			if (err != null) {
				reject(err);
			} else {
				resolve(result);
			}
		});
	});
}

function spawn(cmd, args, options, cb) {
	const child = crossSpawn(cmd, args, options);

	child.stdout.on("data", (data) => {
		console.log(chalk`[{green ${cmd}}] ${data.toString().replace(/\n$/, "")}`);
	});

	child.stderr.on("data", (data) => {
		console.error(chalk`[{red ${cmd}}] ${data.toString().replace(/\n$/, "")}`);
	});

	child.on("exit", (code) => {
		if (code) {
			cb(code);
		} else {
			cb();
		}
	});
}

async function main() {
	const projectName = process.argv[2];

	if (!projectName) {
		console.error(chalk`{bgRed Usage:} ts-scaffolder {yellow project-name} {grey [--iswebapp] [--umdName="{yellow bundleName}"]}`);
		process.exit(1);
	}

	const validationResult = validateNpmPackageName(projectName);

	if (!validationResult.validForNewPackages) {
		console.error(chalk`{bgRed INVALID} {yellow project-name}`);
		console.error(chalk`{yellow project-name} must conform to npm's project name rules: https://www.npmjs.com/package/validate-npm-package-name`);
		if (validationResult.errors) {
			validationResult.errors.forEach(err => {
				console.error(chalk`{grey > ${err}}`);
			});
		}
		process.exit(2);
	}

	{
		console.log(chalk`[{blue ts-scaffolder}] start scaffolding`);
		const projectFolder = path.join(process.cwd(), projectName);

		console.log(chalk`[{blue ts-scaffolder}] create project folder`);
		await asyncify(fs.mkdir, projectFolder, "0750");

		console.log(chalk`[{blue ts-scaffolder}] init git repo`);
		await asyncify(spawn, "git", ["init"], {
			cwd: projectFolder,
		});

		console.log(chalk`[{blue ts-scaffolder}] init npm module`);
		await asyncify(spawn, "npm", ["init", "-y"], {
			cwd: projectFolder,
		});

		console.log(chalk`[{blue ts-scaffolder}] install ts-scaffolder-scripts`);
		await asyncify(spawn, "npm", ["i", "-D", "ts-scaffolder-scripts"], {
			cwd: projectFolder,
		});

		console.log(chalk`[{blue ts-scaffolder}] init ts-scaffolder-scripts`);

		const initArgs = [];
		if (config.get("isWebapp")) {
			initArgs.push("--iswebapp");
		}
		initArgs.push("--umdname")
		initArgs.push(config.get("umdName"));

		await asyncify(spawn, "node_modules/.bin/ts-scaffolder-init", initArgs, {
			cwd: projectFolder,
		});
	}
}

main().catch(err => {
	console.error(chalk.bgRed("UNCATCHED ERROR!"), err);
	console.error(chalk.bgRed("exiting!"));
	process.exit(3);
});
