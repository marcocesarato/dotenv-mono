import fs from "fs";
import path from "path";
import dotenv, {DotenvConfigOutput, DotenvParseOutput} from "dotenv";
import dotenvExpand from "dotenv-expand";

/**
 * Environment variables list
 * @example `{ EXAMPLE: "1", EXAMPLE_2: "2" }`
 */
export type DotenvData = Record<string, any>;

/**
 * Criteria of the filename priority to load as dotenv file
 * @see https://github.com/marcocesarato/dotenv-mono
 * @example `{ '.env': 1, '.env.$(NODE_ENV)': 25, '.env.local': 50, '.env.$(NODE_ENV).local': 75 }`
 */
export type DotenvPriorities = {[key: string]: number};

/**
 * Dotenv matcher result.
 * @example `{ foundDotenv: './', foundDotenv: './.env' }`
 */
export type DotenvMatcherResult = {
	foundPath: string | null | undefined;
	foundDotenv: string | null | undefined;
};

/**
 * Dotenv matcher.
 */
export type DotenvMatcher = (dotenv: string | null | undefined, cwd: string) => DotenvMatcherResult;

/**
 * Configuration settings.
 */
export type DotenvConfig = {
	/**
	 * Specify the current working directory.
	 * @defaultValue `process.cwd()`
	 * @example `require('dotenv-mono').load({ cwd: 'latin1' })`
	 */
	cwd?: string;
	/**
	 * Turn on/off logging to help debug why certain keys or values are not being set as you expect.
	 * @defaultValue `false`
	 * @example `require('dotenv-mono').load({ debug: true })`
	 */
	debug?: boolean;
	/**
	 * Specify the defaults dotenv filename.
	 * @defaultValue `.env.defaults`
	 * @example `require('dotenv-mono').load({ defaults: '.env.default' })`
	 */
	defaults?: string;
	/**
	 * Specify the max depth to reach finding up the folder from the children directory.
	 * @defaultValue `4`
	 * @example `require('dotenv-mono').load({ depth: 3 })`
	 */
	depth?: number;
	/**
	 * Specify the encoding of your file containing environment variables.
	 * @defaultValue `utf8`
	 * @example `require('dotenv-mono').load({ encoding: 'latin1' })`
	 */
	encoding?: BufferEncoding | string;
	/**
	 * Turn on/off the dotenv-expand plugin.
	 * @defaultValue `true`
	 * @example `require('dotenv-mono').load({ expand: false })`
	 */
	expand?: boolean;
	/**
	 * Specify to load specific dotenv file used only on specific apps/packages (ex. .env.server).
	 * @example `require('dotenv-mono').load({ extension: 'server' })`
	 */
	extension?: string;
	/**
	 * Override any environment variables that have already been set on your machine with values from your .env file.
	 * @defaultValue `false`
	 * @example `require('dotenv-mono').load({ override: true })`
	 */
	override?: boolean;
	/**
	 * Specify a custom path if your file containing environment variables is located elsewhere.
	 * @example `require('dotenv-mono').load({ path: '../../configs/.env' })`
	 */
	path?: string;
	/**
	 * Specify the criteria of the filename priority to load as dotenv file.
	 * @see https://github.com/marcocesarato/dotenv-mono
	 * @defaultValue `{ '.env': 1, '.env.$(NODE_ENV)': 25, '.env.local': 50, '.env.$(NODE_ENV).local': 75 }`
	 * @example `require('dotenv-mono').load({ priorities: { '.env.overwrite': 100 } })`
	 */
	priorities?: DotenvPriorities;
};

/**
 * Dotenv controller.
 */
export class Dotenv {
	// Public config properties
	public config: DotenvConfigOutput = {};
	public env: DotenvData = {};
	public extension: string | undefined;
	public path: string | undefined;
	public plain: string = "";

	// Accessor properties
	#_cwd: string = "";
	#_debug: boolean = false;
	#_defaults: string = ".env.defaults";
	#_depth: number = 4;
	#_encoding: BufferEncoding = "utf8";
	#_expand: boolean = true;
	#_override: boolean = false;
	#_priorities: DotenvPriorities = {};

	/**
	 * Constructor.
	 * @param cwd - current Working Directory
	 * @param debug - turn on/off debugging
	 * @param depth - max walking up depth
	 * @param encoding - file encoding
	 * @param expand - turn on/off dotenv-expand plugin
	 * @param extension - add dotenv extension
	 * @param override - override process variables
	 * @param path - dotenv path
	 * @param priorities - priorities
	 */
	constructor({
		cwd,
		debug,
		defaults,
		depth,
		encoding,
		expand,
		extension,
		override,
		path,
		priorities,
	}: DotenvConfig = {}) {
		this.cwd = cwd;
		this.debug = debug;
		this.defaults = defaults;
		this.depth = depth;
		this.encoding = encoding;
		this.expand = expand;
		this.extension = extension;
		this.override = override;
		this.path = path;
		this.priorities = priorities;
		// Auto-bind matchers
		this.dotenvDefaultsMatcher = this.dotenvDefaultsMatcher.bind(this);
		this.dotenvMatcher = this.dotenvMatcher.bind(this);
	}

	/**
	 * Get debugging.
	 */
	get debug(): boolean {
		return this.#_debug;
	}

	/**
	 * Set debugging.
	 * @param value
	 */
	public set debug(value: boolean | undefined) {
		if (value != null) this.#_debug = value;
	}

	/**
	 * Get defaults filename.
	 */
	get defaults(): string {
		return this.#_defaults;
	}

	/**
	 * Set defaults filename.
	 * @param value
	 */
	public set defaults(value: string | undefined) {
		if (value != null) this.#_defaults = value;
	}

	/**
	 * Get encoding.
	 */
	public get encoding(): BufferEncoding {
		return this.#_encoding;
	}

	/**
	 * Set encoding.
	 * @param value
	 */
	public set encoding(value: BufferEncoding | string | undefined) {
		if (value != null) this.#_encoding = value as BufferEncoding;
	}

	/**
	 * Get dotenv-expand plugin enabling.
	 */
	public get expand(): boolean {
		return this.#_expand;
	}

	/**
	 * Turn on/off dotenv-expand plugin.
	 */
	public set expand(value: boolean | undefined) {
		if (value != null) this.#_expand = value;
	}

	/**
	 * Get current working directory.
	 */
	public get cwd(): string {
		if (!this.#_cwd) return process.cwd() ?? "";
		return this.#_cwd;
	}

	/**
	 * Set current working directory.
	 * @param value
	 */
	public set cwd(value: string | undefined) {
		this.#_cwd = value ?? "";
	}

	/**
	 * Get depth.
	 */
	public get depth(): number {
		return this.#_depth;
	}

	/**
	 * Set depth.
	 * @param value
	 */
	public set depth(value: number | undefined) {
		if (value != null) this.#_depth = value;
	}

	/**
	 * Get override.
	 */
	public get override(): boolean {
		return this.#_override;
	}

	/**
	 * Set override.
	 * @param value
	 */
	public set override(value: boolean | undefined) {
		if (value != null) this.#_override = value;
	}

	/**
	 * Get priorities.
	 */
	public get priorities(): DotenvPriorities {
		const nodeEnv = process.env.NODE_ENV ?? "development";
		const ext: string = this.extension ? `.${this.extension}` : "";
		const priorities = Object.assign(
			{
				[`.env${ext}.${nodeEnv}.local`]: 75,
				[`.env${ext}.local`]: 50,
				[`.env${ext}.${nodeEnv}`]: 25,
				[`.env${ext}`]: 1,
			},
			this.#_priorities ?? {},
		);
		return priorities;
	}

	/**
	 * Merge priorities specified with default and check NODE_ENV.
	 * @param value
	 */
	public set priorities(value: DotenvPriorities | undefined) {
		if (value != null) this.#_priorities = value;
	}

	/**
	 * Parses a string or buffer in the .env file format into an object.
	 * @see https://docs.dotenv.org
	 * @returns an object with keys and values based on `src`. example: `{ DB_HOST : 'localhost' }`
	 */
	public parse(src: string | Buffer): DotenvParseOutput {
		return dotenv.parse(src);
	}

	/**
	 * Loads `.env` and default file contents.
	 * @param loadOnProcess - load contents inside process
	 * @returns current instance
	 */
	public load(loadOnProcess: boolean = true): this {
		// Reset
		this.env = {};
		this.config = {};
		// Load dotenv source file
		const file = this.path ?? this.find();
		this.loadDotenv(file, loadOnProcess);
		// Load default without override the source file
		const defaultFile = this.find(this.dotenvDefaultsMatcher);
		this.loadDotenv(defaultFile, loadOnProcess, true);
		return this;
	}

	/**
	 * Load with dotenv package and set parsed and plain content into the instance.
	 * @private
	 * @param file - path to dotenv
	 * @param loadOnProcess - load contents inside process
	 * @param defaults - is the default dotenv
	 */
	private loadDotenv(
		file: string | null | undefined,
		loadOnProcess: boolean,
		defaults: boolean = false,
	): void {
		if (!file || !fs.existsSync(file)) return;
		if (loadOnProcess) {
			let config = dotenv.config({
				path: file,
				debug: this.debug,
				encoding: this.encoding,
				override: !defaults && this.override,
			});
			if (this.expand) config = dotenvExpand.expand(config);
			this.mergeDotenvConfig(config);
		}
		if (!defaults) this.plain = fs.readFileSync(file, {encoding: this.encoding, flag: "r"});
	}

	/**
	 * Merge dotenv package configs.
	 * @private
	 * @param config - dotenv config
	 */
	private mergeDotenvConfig(config: DotenvConfigOutput): void {
		this.config = {
			parsed: {...(this.config.parsed ?? {}), ...(config.parsed ?? {})},
			error: this.config.error ?? config.error ?? undefined,
		};
		this.env = {...this.env, ...(this.config.parsed ?? {})};
	}

	/**
	 * Loads `.env` file contents.
	 * @returns current instance
	 */
	public loadFile(): this {
		this.load(false);
		return this;
	}

	/**
	 * Find first `.env` file walking up from cwd directory based on priority criteria.
	 * @returns file matched with higher priority
	 */
	public find(matcher?: DotenvMatcher): string | null | undefined {
		if (!matcher) matcher = this.dotenvMatcher;
		let dotenv: string | null | undefined = null;
		let directory = path.resolve(this.cwd);
		const {root} = path.parse(directory);
		let depth = 0;
		let match = false;
		while (this.depth ? depth < this.depth : true) {
			depth++;
			const {foundPath, foundDotenv} = matcher(dotenv, directory);
			dotenv = foundDotenv;
			if (match) break;
			if (foundPath) match = true;
			if (directory === root) break;
			directory = path.dirname(directory);
		}
		return dotenv;
	}

	/**
	 * Dotenv matcher.
	 * @private
	 * @param dotenv - dotenv result
	 * @param cwd - current working directory
	 * @returns paths found
	 */
	private dotenvMatcher(dotenv: string | null | undefined, cwd: string): DotenvMatcherResult {
		const priority = -1;
		Object.keys(this.priorities).forEach((fileName) => {
			if (this.priorities[fileName] > priority && fs.existsSync(path.join(cwd, fileName))) {
				dotenv = path.join(cwd, fileName);
			}
		});
		const foundPath = dotenv != null ? cwd : null;
		if (typeof foundPath === "string") {
			try {
				const stat = fs.statSync(path.resolve(cwd, foundPath));
				if (stat.isDirectory()) return {foundPath, foundDotenv: dotenv};
			} catch {}
		}
		return {foundPath, foundDotenv: dotenv};
	}

	/**
	 * Defaults dotenv matcher.
	 * @private
	 * @param dotenv - dotenv result
	 * @param cwd - current working directory
	 * @returns paths found
	 */
	private dotenvDefaultsMatcher(
		dotenv: string | null | undefined,
		cwd: string,
	): DotenvMatcherResult {
		if (fs.existsSync(path.join(cwd, this.defaults))) {
			dotenv = path.join(cwd, this.defaults);
		}
		const foundPath = dotenv != null ? cwd : null;
		if (typeof foundPath === "string") {
			try {
				const stat = fs.statSync(path.resolve(cwd, foundPath));
				if (stat.isDirectory()) return {foundPath, foundDotenv: dotenv};
			} catch {}
		}
		return {foundPath, foundDotenv: dotenv};
	}

	/**
	 * Save `.env` file contents.
	 * @param changes - data to change on the dotenv
	 * @returns current instance
	 */
	public save(changes: DotenvData): this {
		const file = this.path ?? this.find();
		if (!this.plain || !file || !fs.existsSync(file)) return this;

		// https://github.com/stevenvachon/edit-dotenv
		const EOL = "\r\n";
		const breakPattern = /\n/g;
		const breakReplacement = "\\n";
		const flags = "gm";
		const groupPattern = /\$/g;
		const groupReplacement = "$$$";
		const h = "[^\\S\\r\\n]";
		const returnPattern = /\r/g;
		const returnReplacement = "\\r";

		let hasAppended = false;
		const data = Object.keys(changes).reduce((result: string, variable: string) => {
			const value = changes[variable]
				.replace(breakPattern, breakReplacement)
				.replace(returnPattern, returnReplacement)
				.trim();
			const safeName = this.escapeRegExp(variable);
			// Match all between equal and eol
			const varPattern = new RegExp(`^(${h}*${safeName}${h}*=${h}*).*?(${h}*)$`, flags);
			if (varPattern.test(result)) {
				const safeValue = value.replace(groupPattern, groupReplacement);
				return result.replace(varPattern, `$1${safeValue}$2`);
			} else if (result === "") {
				hasAppended = true;
				return `${variable}=${value}${EOL}`;
			} else if (!result.endsWith(EOL) && !hasAppended) {
				hasAppended = true;
				// Add an extra break between previously defined and newly appended variable
				return `${result}${EOL}${EOL}${variable}=${value}`;
			} else if (!result.endsWith(EOL)) {
				// Add break for appended variable
				return `${result}${EOL}${variable}=${value}`;
			} else if (result.endsWith(EOL) && !hasAppended) {
				hasAppended = true;
				// Add an extra break between previously defined and newly appended variable
				return `${result}${EOL}${variable}=${value}${EOL}`;
			} else {
				// Add break for appended variable
				return `${result}${variable}=${value}${EOL}`;
			}
		}, this.plain);
		fs.writeFileSync(file, data, {
			encoding: this.encoding,
		});
		this.plain = data;
		return this;
	}

	/**
	 * Escape regex.
	 * @param string - string to escape
	 * @returns escaped string
	 */
	private escapeRegExp(string: string): string {
		return string.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&").replace(/-/g, "\\x2d");
	}
}

/**
 * Load dotenv on process and return instance of Dotenv.
 * @param props - configuration
 * @returns Dotenv instance
 */
export function dotenvLoad(props?: DotenvConfig): Dotenv {
	const dotenv = new Dotenv(props);
	return dotenv.load();
}

/**
 * @see dotenvLoad
 */
export const load: (props?: DotenvConfig) => Dotenv = dotenvLoad;

/**
 * Load dotenv on process and return the dotenv output.
 * @param props - configuration
 * @returns DotenvConfigOutput
 */
export function dotenvConfig(props?: DotenvConfig): DotenvConfigOutput {
	const dotenv = new Dotenv(props);
	return dotenv.load().config as DotenvConfigOutput;
}

/**
 * @see dotenvConfig
 */
export const config: (props?: DotenvConfig) => DotenvConfigOutput = dotenvConfig;

export default Dotenv;
