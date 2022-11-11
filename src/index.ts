import fs from "fs";
import path from "path";
import dotenv, {DotenvParseOutput} from "dotenv";
import dotenvExpand from "dotenv-expand";

export type DotenvData = Record<string, any>;

export type DotenvPriorities = {[key: string]: number};

export type DotenvArgs = {
	cwd?: string;
	debug?: boolean;
	depth?: number;
	encoding?: BufferEncoding;
	extension?: string;
	expand?: boolean;
	override?: boolean;
	path?: string;
	priorities?: DotenvPriorities;
};

export class Dotenv {
	public env: DotenvData = {};
	public extension: string | undefined;
	public path: string | undefined;
	public plain: string = "";

	private _cwd: string = "";
	private _debug: boolean = false;
	private _depth: number = 4;
	private _encoding: BufferEncoding = "utf8";
	private _expand: boolean = true;
	private _override: boolean = false;
	private _priorities: DotenvPriorities = {};
	private _nodeEnv: string = "";

	constructor({
		path,
		cwd,
		extension,
		expand,
		depth,
		priorities,
		encoding,
		debug,
		override,
	}: DotenvArgs = {}) {
		this.path = path;
		this.cwd = cwd;
		this.extension = extension;
		this.expand = expand;
		this.depth = depth;
		this.priorities = priorities;
		this.encoding = encoding;
		this.debug = debug;
		this.override = override;
	}

	get debug() {
		return this._debug;
	}

	set debug(value: boolean | undefined) {
		if (value != null) this._debug = value;
	}

	get encoding(): BufferEncoding {
		return this._encoding;
	}

	set encoding(value: BufferEncoding | undefined) {
		if (value != null) this._encoding = value;
	}

	get expand() {
		return this._expand;
	}

	set expand(value: boolean | undefined) {
		if (value != null) this._expand = value;
	}

	get cwd(): string {
		if (!this._cwd) return process.cwd() ?? "";
		return this._cwd;
	}

	set cwd(value: string | undefined) {
		this._cwd = value ?? "";
	}

	get depth() {
		return this._depth;
	}

	set depth(value: number | undefined) {
		if (value != null) this._depth = value;
	}

	get override() {
		return this._override;
	}

	set override(value: boolean | undefined) {
		if (value != null) this._override = value;
	}

	get priorities(): DotenvPriorities {
		return this._priorities;
	}

	set priorities(value: DotenvPriorities | undefined) {
		this._nodeEnv = process.env.NODE_ENV ?? "development";
		const ext: string = this.extension ? `.${this.extension}` : "";
		this._priorities = Object.assign(
			{
				[`.env${ext}.${this._nodeEnv}.local`]: 75,
				[`.env${ext}.local`]: 50,
				[`.env${ext}.${this._nodeEnv}`]: 25,
				[`.env${ext}`]: 1,
			},
			value ?? {},
		);
	}

	parse<T extends DotenvParseOutput = DotenvParseOutput>(): T {
		// @ts-ignore
		return dotenv.parse.apply(this, Array.from(arguments));
	}

	load(loadOnProcess: boolean = true): this {
		const file: string = this.path ?? (this.find() as string);
		if (fs.existsSync(file)) {
			if (loadOnProcess) {
				const config = dotenv.config({
					path: file,
					debug: this.debug,
					encoding: this.encoding,
					override: this.override,
				});
				if (this.expand) {
					this.env = dotenvExpand.expand(config)?.parsed ?? {};
				} else {
					this.env = config?.parsed ?? {};
				}
			}
			this.plain = fs.readFileSync(file, {encoding: this.encoding, flag: "r"});
		}
		return this;
	}

	loadFile(): this {
		this.load(false);
		return this;
	}

	find(): string | undefined {
		let dotenv: string | undefined;
		let directory = path.resolve(this.cwd);
		const {root} = path.parse(directory);
		const matcher = (cwd: string) => {
			const priority = -1;
			Object.keys(this.priorities).forEach((fileName) => {
				if (
					this.priorities[fileName] > priority &&
					fs.existsSync(path.join(cwd, fileName))
				) {
					dotenv = path.join(cwd, fileName);
				}
			});
			const foundPath = dotenv != null ? cwd : null;
			if (typeof foundPath === "string") {
				try {
					const stat = fs.statSync(path.resolve(cwd, foundPath));
					if (stat.isDirectory()) return foundPath;
				} catch {}
			}
			return foundPath;
		};
		let depth = 0;
		let match = false;
		while (this.depth ? depth < this.depth : true) {
			depth++;
			const foundPath = matcher(directory);
			if (match) break;
			if (foundPath) match = true;
			if (directory === root) break;
			directory = path.dirname(directory);
		}
		return dotenv;
	}

	save(changes: DotenvData): this {
		if (!this.plain || !this.path) return this;

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
		fs.writeFileSync(this.path, data, {
			encoding: this.encoding,
		});
		return this;
	}

	escapeRegExp(string: string): string {
		return string.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&").replace(/-/g, "\\x2d");
	}
}

export function dotenvLoad(): Dotenv {
	const dotenv = new Dotenv(...arguments);
	return dotenv.load();
}
