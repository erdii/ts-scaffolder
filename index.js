#!/usr/bin/env node

const path = require("path");
const child_process = require("child_process");
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

function exec(cmd, options, cb) {
	child_process.exec(cmd, options, (err, stdout, stderr) => {
		cb(err, {
			stderr,
			stdout,
		});
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
		const projectFolder = path.join(process.cwd(), projectName);
		await asyncify(exec, `mkdir "${projectFolder}"`, {});
		await asyncify(exec, "npm init -y", {
			cwd: projectFolder,
		});
		await asyncify(exec, "npm i -D ts-scaffolder-scripts", {
			cwd: projectFolder,
		});
		await asyncify(exec, `node_modules/.bin/ts-scaffolder-init${config.get("isWebapp") ? " --iswebapp" : ""} --umdname "${config.get("umdName")}"`, {
			cwd: projectFolder,
		});
	}
}

main().catch(err => {
	console.error(chalk.bgRed("UNCATCHED ERROR!"), err);
	console.error(chalk.bgRed("exiting!"));
	process.exit(3);
});
