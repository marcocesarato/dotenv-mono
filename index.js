const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const dotenvExpand = require("dotenv-expand");

class DotEnv {
	constructor(props = {}) {
		this.path = props.path;
		this.expand = props.expand ?? false;
		this.ext = props.extension;
		this.env = {};
		this.setPriorities(props.priorities);
	}

	setPriorities(priorities = {}) {
		this.nodeEnv = process.env.NODE_ENV || "development";

		const ext = this.ext ? `.${this.ext}` : "";
		this.priorities = {
			[`.env${ext}.${this.nodeEnv}.local`]: 75,
			[`.env${ext}.local`]: 50,
			[`.env${ext}.${this.nodeEnv}`]: 25,
			[`.env${ext}`]: 1,
			...(priorities ?? {}),
		};

		return this;
	}

	load(loadOnProcess = true) {
		if (!this.path) {
			this.path = this.find();
		}
		if (fs.existsSync(this.path)) {
			if (loadOnProcess) {
				const config = dotenv.config({
					path: this.path,
				});
				if (this.expand) {
					this.env = dotenvExpand.expand(config)?.parsed ?? {};
				} else {
					this.env = config?.parsed ?? {};
				}
			}
			this.envString = fs.readFileSync(this.path, {encoding: "utf8", flag: "r"});
		}
		return this;
	}

	loadFile() {
		this.load(false);
		return this;
	}

	find() {
		let dotenv = null;
		let directory = path.resolve(process.cwd() || "");
		const maxDepth = 3;
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
		while (maxDepth ? depth < maxDepth : true) {
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
		if (!this.envString) return;

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
			const varPattern = new RegExp(`^(${h}*${safeName}${h}*=${h}*).*?(${h}*)$`, flags);
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
		}, this.envString);
		fs.writeFileSync(this.path, data, {
			encoding: "utf8",
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
