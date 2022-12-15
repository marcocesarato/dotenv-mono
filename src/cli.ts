import {DotenvConfig} from "./index";

/**
 * Generic object.
 */
type GenericObject<T = any> = {[key: string]: T};

/**
 * Configuration option types.
 */
export enum OptionType {
	boolean,
	number,
	string,
	array,
	object,
	mapOfNumbers,
}

/**
 * List of all Dotenv configuration options type.
 */
export const DotenvOptionsType: GenericObject<OptionType> = {
	cwd: OptionType.string,
	debug: OptionType.boolean,
	defaults: OptionType.string,
	depth: OptionType.number,
	encoding: OptionType.string,
	expand: OptionType.boolean,
	extension: OptionType.string,
	path: OptionType.string,
	override: OptionType.boolean,
	priorities: OptionType.mapOfNumbers,
};

/**
 * Parse error.
 */
class ParseError extends Error {
	constructor(message: string, option: string = "") {
		super(`${message} Parsed value: ${option}`);
		this.name = "ParseError";
	}
}

/**
 * Parse CLI parameter type.
 * @param option - value to parse
 * @param type - value type
 * @returns parsed option
 */
export function parseOption(option: string | undefined, type: OptionType): any {
	// Undefined
	if (option === undefined || option === null) return undefined;
	// Number
	if (type === OptionType.number) return Number(option);
	// Boolean
	if (type === OptionType.boolean) return option === "true";
	// Objects
	if (
		type === OptionType.array ||
		type === OptionType.object ||
		type === OptionType.mapOfNumbers
	) {
		try {
			const result = JSON.parse(option);
			// Check if is an object
			if (typeof result !== "object") {
				throw new ParseError(`The value is not an object.`, option);
			}
			if (type === OptionType.array) {
				// Array
				return Object.values(result);
			}
			// Check if is a map of numbers, null and undefined are allowed
			if (
				type === OptionType.mapOfNumbers &&
				Object.values(result).some((v) => v && typeof v !== "number")
			) {
				throw new ParseError(`The value is not an map of numbers.`, option);
			}
			// Object
			return result;
		} catch (e) {
			console.error(`Invalid option value!\r\n`, e);
			return undefined;
		}
	}
	// String
	return option;
}

/**
 * Run CLI Dotenv runners.
 * @param runner
 */
export function runCli(runner: Function): any {
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
	const keys: string = Object.keys(DotenvOptionsType).join("|");
	const re = new RegExp(`^dotenv_config_(${keys})=(.*?)$`, "g");
	const cliOptions = args.reduce(function (opts, cur) {
		const matches = cur.match(re);
		if (matches) {
			const option = String(matches[1]).trim();
			const match = String(matches[2]).trim();
			opts[option] = parseOption(match, DotenvOptionsType[option]);
		}
		return opts;
	}, {} as any) as DotenvConfig;
	// Run command
	return runner({...options, ...cliOptions});
}
