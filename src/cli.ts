import {DotenvConfig} from "./index";

/**
 * Generic object.
 */
type GenericObject<T = any> = {[key: string]: T};

/**
 * Configuration option types.
 */
enum OptionType {
	boolean,
	number,
	string,
	object,
	array,
}

/**
 * List of all Dotenv configuration options type.
 */
const DotenvOptionsType: GenericObject<OptionType> = {
	cwd: OptionType.string,
	debug: OptionType.boolean,
	defaults: OptionType.string,
	depth: OptionType.number,
	encoding: OptionType.string,
	expand: OptionType.boolean,
	extension: OptionType.string,
	path: OptionType.string,
	override: OptionType.boolean,
	priorities: OptionType.object,
};

/**
 * Parse CLI parameter type.
 * @param option - value to parse
 * @param type - value type
 * @returns parsed option
 */
function parseOption(option: string | undefined, type: OptionType): any {
	if (option === undefined) return option;
	if (type === OptionType.number) return Number(option);
	if (type === OptionType.boolean) return option === "true";
	if (type === OptionType.object) {
		try {
			return JSON.parse(option);
		} catch (e) {
			console.error(e);
		}
	}
	return option;
}

/**
 * Run CLI Dotenv runners.
 * @param runner
 */
export function runCli(runner: Function) {
	// Empty options
	const options: GenericObject = {};
	// Environment configuration
	Object.keys(DotenvOptionsType).forEach((option) => {
		const envName = "DOTENV_CONFIG_" + option.toUpperCase();
		if (process.env[envName] != null) {
			options[option] = parseOption(process.env[envName], DotenvOptionsType[option]);
		}
	});
	// CLI Parameter configuration parser
	const args: string[] = process.argv;
	const keys: string = Object.keys(options).join("|");
	const re = new RegExp(`^dotenv_config_(${keys})=(.+)$`, "g");
	const cliOptions = args.reduce(function (opts, cur) {
		const matches = cur.match(re);
		if (matches) {
			const option: any = String(matches[1]).trim();
			const match: any = String(matches[2]).trim();
			opts[option] = parseOption(match, DotenvOptionsType[option]);
		}
		return opts;
	}, {} as any) as DotenvConfig;
	// Run command
	runner({...options, ...cliOptions});
}
