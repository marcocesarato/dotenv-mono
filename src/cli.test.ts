import {OptionType, parseOption, runCli} from "./cli";
import {config, Dotenv, load} from "./index";
import {DotenvConfigOutput} from "dotenv";
import mockFs from "mock-fs";

describe("Run CLI", () => {
	const originalEnv = process.env;

	beforeEach(() => {
		process.env = {...originalEnv, NODE_ENV: "test"};
		process.argv = ["node", "script.js"]; // Reset argv to default
		mockFs({"/root/.env": "TEST_ROOT_ENV=1"});
		jest.spyOn(process, "cwd").mockReturnValue("/root/apps");
	});

	afterEach(() => {
		// Restore original process.env and argv
		process.env = originalEnv;
		process.argv = ["node", "script.js"];
		jest.resetModules();
		mockFs.restore();
		jest.restoreAllMocks();
	});

	it("should expose a function", () => {
		expect(runCli).toBeDefined();
	});

	it("should not throw errors", () => {
		expect(() => runCli(load)).not.toThrow();
		expect(() => runCli(config)).not.toThrow();
	});

	it("should return the expected output", () => {
		const dotenv = runCli(load) as Dotenv;
		expect(dotenv instanceof Dotenv).toBeTruthy();
		expect(dotenv.env).not.toBeEmptyObject();

		const output = runCli(config) as DotenvConfigOutput;
		expect(output).toHaveProperty("parsed");
		expect(output.parsed).not.toBeEmptyObject();
	});

	it("should return the expected output using environmental options", () => {
		process.env.DOTENV_CONFIG_DEBUG = "true";
		const dotenv = runCli(load) as Dotenv;
		expect(dotenv instanceof Dotenv).toBeTruthy();
		expect(dotenv.env).not.toBeEmptyObject();
	});

	it("should return the expected output using argv options", () => {
		process.argv = ["node", "script.js", "dotenv_config_debug=true"];
		const dotenv = runCli(load) as Dotenv;
		expect(dotenv instanceof Dotenv).toBeTruthy();
		expect(dotenv.env).not.toBeEmptyObject();
	});

	it("should handle multiple environmental options", () => {
		process.env.DOTENV_CONFIG_DEBUG = "true";
		process.env.DOTENV_CONFIG_OVERRIDE = "true";
		process.env.DOTENV_CONFIG_EXPAND = "false";
		process.env.DOTENV_CONFIG_DEPTH = "2";

		const dotenv = runCli(load) as Dotenv;
		expect(dotenv instanceof Dotenv).toBeTruthy();
		expect(dotenv.debug).toBe(true);
		expect(dotenv.override).toBe(true);
		expect(dotenv.expand).toBe(false);
		expect(dotenv.depth).toBe(2);
	});

	it("should handle multiple argv options", () => {
		process.argv = [
			"node",
			"script.js",
			"dotenv_config_debug=true",
			"dotenv_config_override=false",
			"dotenv_config_depth=3",
		];

		const dotenv = runCli(load) as Dotenv;
		expect(dotenv instanceof Dotenv).toBeTruthy();
		expect(dotenv.debug).toBe(true);
		expect(dotenv.override).toBe(false);
		expect(dotenv.depth).toBe(3);
	});

	it("should prioritize argv options over environmental options", () => {
		// Set env vars
		process.env.DOTENV_CONFIG_DEBUG = "false";
		process.env.DOTENV_CONFIG_DEPTH = "5";

		// Set argv that should override env vars
		process.argv = ["node", "script.js", "dotenv_config_debug=true", "dotenv_config_depth=2"];

		const dotenv = runCli(load) as Dotenv;
		expect(dotenv.debug).toBe(true); // argv should win
		expect(dotenv.depth).toBe(2); // argv should win
	});

	it("should handle invalid argv format gracefully", () => {
		process.argv = [
			"node",
			"script.js",
			"invalid_option=value",
			"dotenv_config_=empty_option",
			"dotenv_config_debug=true",
		];

		expect(() => runCli(load)).not.toThrow();
		const dotenv = runCli(load) as Dotenv;
		expect(dotenv.debug).toBe(true); // Valid option should still work
	});
});

describe("Parse Option", () => {
	it("should expose a function", () => {
		expect(parseOption).toBeDefined();
	});

	it("should return expected output", () => {
		expect(parseOption).toBeDefined();
		expect(parseOption(undefined, OptionType.number)).toBeUndefined();
		expect(parseOption("1", OptionType.number)).toEqual(1);
		expect(parseOption("true", OptionType.boolean)).toBeTrue();
		expect(parseOption("false", OptionType.boolean)).toBeFalse();
		expect(parseOption("message", OptionType.string)).toEqual("message");
		expect(parseOption('{"value": 1}', OptionType.object)).toEqual({"value": 1});
		expect(parseOption("[1, 2]", OptionType.array)).toEqual([1, 2]);
		expect(parseOption('{"value": 1, "empty": null}', OptionType.mapOfNumbers)).toEqual({
			"value": 1,
			"empty": null,
		});
		// Wrong JSON data
		jest.spyOn(console, "error").mockImplementationOnce(() => {});
		expect(parseOption("1", OptionType.object)).toBeUndefined();
		jest.spyOn(console, "error").mockImplementationOnce(() => {});
		expect(parseOption('{"value": "string"}', OptionType.mapOfNumbers)).toBeUndefined();
		// Malformed JSON parsing
		jest.spyOn(console, "error").mockImplementationOnce(() => {});
		expect(parseOption('{"malformed": 1]]', OptionType.object)).toBeUndefined();
	});

	it("should handle null input for parseOption", () => {
		expect(parseOption(undefined, OptionType.string)).toBeUndefined();
	});

	it("should handle number parsing edge cases", () => {
		expect(parseOption("0", OptionType.number)).toBe(0);
		expect(parseOption("-123", OptionType.number)).toBe(-123);
		expect(parseOption("123.456", OptionType.number)).toBe(123.456);
		expect(parseOption("Infinity", OptionType.number)).toBe(Infinity);
		expect(parseOption("NaN", OptionType.number)).toBeNaN();
		expect(parseOption("abc", OptionType.number)).toBeNaN();
	});

	it("should handle boolean parsing edge cases", () => {
		expect(parseOption("TRUE", OptionType.boolean)).toBe(false); // Only "true" should be true
		expect(parseOption("false", OptionType.boolean)).toBe(false);
		expect(parseOption("1", OptionType.boolean)).toBe(false);
		expect(parseOption("0", OptionType.boolean)).toBe(false);
		expect(parseOption("", OptionType.boolean)).toBe(false);
	});

	it("should handle array parsing", () => {
		expect(parseOption("[]", OptionType.array)).toEqual([]);
		expect(parseOption('["item1", "item2"]', OptionType.array)).toEqual(["item1", "item2"]);
		expect(parseOption("[1, 2, 3]", OptionType.array)).toEqual([1, 2, 3]);

		// Invalid array JSON
		jest.spyOn(console, "error").mockImplementationOnce(() => {});
		expect(parseOption("[invalid]", OptionType.array)).toBeUndefined();
	});

	it("should handle mapOfNumbers validation", () => {
		expect(parseOption("{}", OptionType.mapOfNumbers)).toEqual({});
		expect(parseOption('{"a": 1, "b": 2}', OptionType.mapOfNumbers)).toEqual({"a": 1, "b": 2});
		expect(parseOption('{"a": null, "b": undefined}', OptionType.mapOfNumbers)).toEqual({
			"a": null,
		});

		// Should reject non-number values
		jest.spyOn(console, "error").mockImplementationOnce(() => {});
		expect(parseOption('{"a": "string"}', OptionType.mapOfNumbers)).toBeUndefined();

		jest.spyOn(console, "error").mockImplementationOnce(() => {});
		expect(parseOption('{"a": true}', OptionType.mapOfNumbers)).toBeUndefined();
	});

	it("should handle string parsing with special characters", () => {
		expect(parseOption("hello world", OptionType.string)).toBe("hello world");
		expect(parseOption("special!@#$%^&*()", OptionType.string)).toBe("special!@#$%^&*()");
		expect(parseOption("unicode: 你好", OptionType.string)).toBe("unicode: 你好");
		expect(parseOption("", OptionType.string)).toBe("");
	});
});
