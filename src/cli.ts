#!/usr/bin/env node

import spawn from "cross-spawn";
import minimist from "minimist";
import {dotenvLoad, DotenvConfig} from "./index";

const HELP_OPTIONS = [
	{flag: "--help", desc: "print help"},
	{
		flag: "--debug",
		desc: "output the files that would be processed but don't actually parse them or run the command",
	},
	{
		flag: "-e <path>",
		desc: "parses the file <path> as a .env file and adds the variables to the environment",
	},
	{flag: "-e <path>", desc: "multiple -e flags are allowed"},
	{flag: "-v <n>=<value>", desc: "put variable <n> into environment using value <value>"},
	{flag: "-v <n>=<value>", desc: "multiple -v flags are allowed"},
	{
		flag: "-p <variable>",
		desc: "print value of <variable> to the console. If you specify this, you do not have to specify a command",
	},
	{flag: "--no-expand", desc: "skip variable expansion"},
	{flag: "--override", desc: "override system variables"},
	{flag: "--quiet", desc: "suppress console output from dotenv"},
	{flag: "--cwd <path>", desc: "specify the current working directory"},
	{
		flag: "--depth <number>",
		desc: "specify the max depth to reach finding up the folder from the children directory",
	},
	{
		flag: "--encoding <enc>",
		desc: "specify the encoding of your file containing environment variables",
	},
	{
		flag: "--extension <ext>",
		desc: "specify to load specific dotenv file used only on specific apps/packages",
	},
	{flag: "--defaults <file>", desc: "specify the defaults dotenv filename"},
	{
		flag: "--priorities <json>",
		desc: "specify the criteria of the filename priority to load as dotenv file",
	},
	{
		flag: "command",
		desc: "command is the actual command you want to run. Best practice is to precede this command with -- . Everything after -- is considered to be your command. So any flags will not be parsed by this tool but be passed to your command. If you do not do it, this tool will strip those flags",
	},
];

function printHelp(): void {
	console.log(
		"Usage: dotenv-mono [--help] [--debug] [-e <path>] [-v <n>=<value>] [-p <variable>] [--no-expand] [--override] [-- command] [--quiet] [--cwd <path>] [--depth <number>] [--encoding <enc>] [--extension <ext>] [--defaults <file>] [--priorities <json>]\n",
	);
	for (const opt of HELP_OPTIONS) {
		// For the 'command' line, print the description on a new line for clarity
		if (opt.flag === "command") {
			console.log(`  ${opt.flag.padEnd(21)}${opt.desc}`);
		} else {
			console.log(`  ${opt.flag.padEnd(21)}${opt.desc}`);
		}
	}
}

function validateCmdVariable(param: string): [string, string] {
	const match = param.match(/^(\w+)=([\s\S]+)$/m);
	if (!match) {
		console.error(
			`Invalid variable name. Expected variable in format '-v variable=value', but got: \`-v ${param}\`.`,
		);
		process.exit(1);
	}
	const [, key, val] = match;
	return [key, val];
}

function main(): void {
	const argv = minimist(process.argv.slice(2));

	if (argv.help) {
		printHelp();
		process.exit(0);
	}

	// Build dotenv-mono configuration from CLI arguments
	const config: DotenvConfig = {};

	if (argv.cwd) config.cwd = argv.cwd;
	if (argv.debug !== undefined) config.debug = argv.debug;
	if (argv.defaults) config.defaults = argv.defaults;
	if (argv.depth !== undefined) config.depth = Number(argv.depth);
	if (argv.encoding) config.encoding = argv.encoding;
	if (argv.override !== undefined) config.override = argv.override;
	if (argv.extension) config.extension = argv.extension;
	if (argv.quiet !== undefined) config.quiet = argv.quiet;

	// Handle expand flag (--no-expand sets it to false)
	if (argv["no-expand"] !== undefined) {
		config.expand = false;
	} else if (argv.expand !== undefined) {
		config.expand = argv.expand;
	}

	// Handle priorities (JSON string)
	if (argv.priorities) {
		try {
			config.priorities = JSON.parse(argv.priorities);
		} catch (error) {
			console.error("Invalid priorities JSON:", error);
			process.exit(1);
		}
	}

	// Handle multiple -e flags for custom paths
	const paths: string[] = [];
	if (argv.e) {
		if (typeof argv.e === "string") {
			paths.push(argv.e);
		} else {
			paths.push(...argv.e);
		}
	}

	// Handle multiple -v flags for variables
	const variables: [string, string][] = [];
	if (argv.v) {
		if (typeof argv.v === "string") {
			variables.push(validateCmdVariable(argv.v));
		} else {
			variables.push(...argv.v.map(validateCmdVariable));
		}
	}

	// If debug mode, just show what would be processed
	if (argv.debug) {
		console.log("Configuration:", config);
		console.log("Custom paths:", paths);
		console.log("Variables:", variables);
		process.exit(0);
	}

	// Load dotenv files
	if (paths.length > 0) {
		// Load each specified path
		paths.forEach((path) => {
			const pathConfig = {...config, path};
			try {
				dotenvLoad(pathConfig);
			} catch (error) {
				console.error(`Error loading dotenv file: ${path}`, error);
				process.exit(1);
			}
		});
	} else {
		// Use default dotenv-mono behavior
		try {
			dotenvLoad(config);
		} catch (error) {
			console.error("Error loading dotenv files:", error);
			process.exit(1);
		}
	}

	// Apply command-line variables (these override dotenv variables)
	variables.forEach(([key, value]) => {
		process.env[key] = value;
	});

	// Handle print variable flag
	if (argv.p) {
		const value = process.env[argv.p];
		console.log(value != null ? value : "");
		process.exit(0);
	}

	// Get the command to run
	const command = argv._[0];
	if (!command) {
		printHelp();
		process.exit(1);
	}

	// Spawn the command with the loaded environment
	const child = spawn(command, argv._.slice(1), {
		stdio: "inherit",
		env: process.env,
	}).on("exit", function (exitCode, signal) {
		if (typeof exitCode === "number") {
			process.exit(exitCode);
		} else {
			process.kill(process.pid, signal as NodeJS.Signals);
		}
	});

	// Forward signals to child process
	const signals: NodeJS.Signals[] = [
		"SIGINT",
		"SIGTERM",
		"SIGPIPE",
		"SIGHUP",
		"SIGBREAK",
		"SIGWINCH",
		"SIGUSR1",
		"SIGUSR2",
	];
	signals.forEach((signal) => {
		process.on(signal, function () {
			child.kill(signal);
		});
	});
}

// Only run if this file is executed directly
if (require.main === module) {
	main();
}

export {main};
