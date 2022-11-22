import {DotenvConfig} from "./index";

/**
 * Run CLI Dotenv runners.
 * @param runner
 */
export function runCli(runner: Function) {
	// Empty options
	const options: DotenvConfig = {
		cwd: undefined,
		debug: undefined,
		defaults: undefined,
		depth: undefined,
		encoding: undefined,
		expand: undefined,
		extension: undefined,
		path: undefined,
		override: undefined,
		priorities: undefined,
	};
	// Environment configuration
	if (process.env.DOTENV_CONFIG_CWD != null) {
		options.cwd = process.env.DOTENV_CONFIG_CWD;
	}
	if (process.env.DOTENV_CONFIG_DEBUG != null) {
		options.debug = process.env.DOTENV_CONFIG_DEBUG === "true";
	}
	if (process.env.DOTENV_CONFIG_DEFAULTS != null) {
		options.defaults = process.env.DOTENV_CONFIG_DEFAULTS;
	}
	if (process.env.DOTENV_CONFIG_DEPTH != null) {
		options.depth = Number(process.env.DOTENV_CONFIG_DEPTH);
	}
	if (process.env.DOTENV_CONFIG_ENCODING != null) {
		options.encoding = process.env.DOTENV_CONFIG_ENCODING as BufferEncoding;
	}
	if (process.env.DOTENV_CONFIG_EXPAND != null) {
		options.expand = process.env.DOTENV_CONFIG_EXPAND === "true";
	}
	if (process.env.DOTENV_CONFIG_EXTENSION != null) {
		options.extension = process.env.DOTENV_CONFIG_EXTENSION;
	}
	if (process.env.DOTENV_CONFIG_PATH != null) {
		options.path = process.env.DOTENV_CONFIG_PATH;
	}
	if (process.env.DOTENV_CONFIG_OVERRIDE != null) {
		options.override = process.env.DOTENV_CONFIG_OVERRIDE === "true";
	}
	if (process.env.DOTENV_CONFIG_PRIORITIES != null) {
		try {
			options.priorities = JSON.parse(process.env.DOTENV_CONFIG_PRIORITIES);
		} catch (e) {
			console.error(e);
		}
	}
	// CLI Parameter configuration parser
	const args: string[] = process.argv;
	const keys: string = Object.keys(options).join("|");
	const re = new RegExp(`^dotenv_config_(${keys})=(.+)$`, "g");
	const cliOptions = args.reduce(function (acc, cur) {
		const matches = cur.match(re);
		if (matches) {
			let match: any = String(matches[2]).trim();
			const isBoolean = match === "true" || match === "false";
			if (isBoolean) {
				match = match === "true";
			}
			acc[String(matches[1])] = match;
		}
		return acc;
	}, {} as any) as DotenvConfig;
	// Run command
	runner({...options, ...cliOptions});
}
