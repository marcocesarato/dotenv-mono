const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const dotenvExpand = require("dotenv-expand");

class DotEnv {
	constructor(props = {}) {
		this.path = props.path;
		this.cwd = props.cwd;
		this.extension = props.extension;
		this.expand = props.expand;
		this.depth = props.depth;
		this.priorities = props.priorities;
		this.encoding = props.encoding;
		this.debug = props.debug;
		this.override = props.override;
	}

	get debug() {
		if (this._debug == null) return false;
		return this._debug;
	}

	set debug(value) {
		this._debug = value;
	}

	get encoding() {
		if (this._encoding == null) return "utf8";
		return this._encoding;
	}

	set encoding(value) {
		this._encoding = value;
	}

	get expand() {
		if (this._expand == null) return true;
		return this._expand;
	}

	set expand(value) {
		this._expand = value;
	}

	get cwd() {
		if (this._cwd == null) return process.cwd() || "";
		return this._cwd;
	}

	set cwd(value) {
		this._cwd = value;
	}

	get depth() {
		if (this._depth == null) return 4;
		return this._depth;
	}

	set depth(value) {
		this._depth = value;
	}

	get override() {
		if (this._override == null) return false;
		return this._override;
	}

	set override(value) {
		this._override = value;
	}

	get priorities() {
		return this._priorities;
	}

	set priorities(value) {
		this.nodeEnv = process.env.NODE_ENV || "development";
		const ext = this.extension ? `.${this.extension}` : "";
		this._priorities = Object.assign(
			{
				[`.env${ext}.${this.nodeEnv}.local`]: 75,
				[`.env${ext}.local`]: 50,
				[`.env${ext}.${this.nodeEnv}`]: 25,
				[`.env${ext}`]: 1,
			},
			value || {},
		);
	}

	parse() {
		return dotenv.parse.apply(this, arguments);
	}

	load(loadOnProcess = true) {
		if (!this.path) {
			this.path = this.find();
		}
		if (fs.existsSync(this.path)) {
			if (loadOnProcess) {
				const config = dotenv.config({
					path: this.path,
					debug: this.debug,
					encoding: this.encoding,
					override: this.override,
				});
				if (this.expand) {
					this.env = dotenvExpand.expand(config)?.parsed || {};
				} else {
					this.env = config?.parsed || {};
				}
			}
			this.plain = fs.readFileSync(this.path, {encoding: this.encoding, flag: "r"});
		}
		return this;
	}

	loadFile() {
		this.load(false);
		return this;
	}

	find() {
		let dotenv = null;
		let directory = path.resolve(this.cwd);
		const {root} = path.parse(directory);
		const matcher = (cwd) => {
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

	save(changes) {
		if (!this.plain) return;

		// https://github.com/stevenvachon/edit-dotenv
		// Steven Vachon
		// @stevenvachon

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
		const data = Object.keys(changes).reduce((result, varname) => {
			const value = changes[varname]
				.replace(breakPattern, breakReplacement)
				.replace(returnPattern, returnReplacement)
				.trim();
			const safeName = this.escapeRegExp(varname);
			const varPattern = new RegExp(`^(${h}*${safeName}${h}*=${h}*).*?(${h}*)$`, flags); // fixed regex
			if (varPattern.test(result)) {
				const safeValue = value.replace(groupPattern, groupReplacement);
				return result.replace(varPattern, `$1${safeValue}$2`);
			} else if (result === "") {
				hasAppended = true;
				return `${varname}=${value}${EOL}`;
			} else if (!result.endsWith(EOL) && !hasAppended) {
				hasAppended = true;
				// Add an extra break between previously defined and newly appended variable
				return `${result}${EOL}${EOL}${varname}=${value}`;
			} else if (!result.endsWith(EOL)) {
				// Add break for appended variable
				return `${result}${EOL}${varname}=${value}`;
			} else if (result.endsWith(EOL) && !hasAppended) {
				hasAppended = true;
				// Add an extra break between previously defined and newly appended variable
				return `${result}${EOL}${varname}=${value}${EOL}`;
			} else {
				// Add break for appended variable
				return `${result}${varname}=${value}${EOL}`;
			}
		}, this.plain);
		fs.writeFileSync(this.path, data, {
			encoding: this.encoding,
		});
		return this;
	}

	escapeRegExp(string) {
		return string.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&").replace(/-/g, "\\x2d");
	}
}

module.exports = {
	DotEnv,
	dotenvLoad: (...args) => {
		const dotenv = new DotEnv(...args);
		return dotenv.load();
	},
};
