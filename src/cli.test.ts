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

	it("should handle null value as parameter", () => {
		// Test null handling which is covered in the condition: option === null
		expect(
			parseOption(null as unknown as string | undefined, OptionType.string),
		).toBeUndefined();
		expect(
			parseOption(null as unknown as string | undefined, OptionType.number),
		).toBeUndefined();
		expect(
			parseOption(null as unknown as string | undefined, OptionType.boolean),
		).toBeUndefined();
		expect(
			parseOption(null as unknown as string | undefined, OptionType.array),
		).toBeUndefined();
		expect(
			parseOption(null as unknown as string | undefined, OptionType.object),
		).toBeUndefined();
		expect(
			parseOption(null as unknown as string | undefined, OptionType.mapOfNumbers),
		).toBeUndefined();
	});

	it("should reject non-array values for array type", () => {
		// Test ParseError for non-array values
		jest.spyOn(console, "error").mockImplementationOnce(() => {});
		expect(parseOption('{"key": "value"}', OptionType.array)).toBeUndefined();

		jest.spyOn(console, "error").mockImplementationOnce(() => {});
		expect(parseOption('"string"', OptionType.array)).toBeUndefined();

		jest.spyOn(console, "error").mockImplementationOnce(() => {});
		expect(parseOption("123", OptionType.array)).toBeUndefined();
	});

	it("should reject array values for object type", () => {
		// Test ParseError for array values when expecting object
		jest.spyOn(console, "error").mockImplementationOnce(() => {});
		expect(parseOption("[1, 2, 3]", OptionType.object)).toBeUndefined();

		jest.spyOn(console, "error").mockImplementationOnce(() => {});
		expect(parseOption('["item1", "item2"]', OptionType.object)).toBeUndefined();
	});

	it("should handle mapOfNumbers preprocessing with undefined values", () => {
		// Test the undefined value preprocessing in mapOfNumbers
		expect(parseOption('{"a": 1, "b": undefined, "c": 2}', OptionType.mapOfNumbers)).toEqual({
			"a": 1,
			"c": 2,
		});

		expect(parseOption('{"first": undefined, "second": 42}', OptionType.mapOfNumbers)).toEqual({
			"second": 42,
		});

		expect(parseOption('{"onlyUndefined": undefined}', OptionType.mapOfNumbers)).toEqual({});
	});

	// Additional CLI edge cases
	it("should handle CLI options with special characters and formatting", () => {
		// Mock console.error to suppress expected debug output
		const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

		process.argv = [
			"node",
			"script.js",
			"dotenv_config_path=/path/with spaces/.env",
			"dotenv_config_debug=true",
			'dotenv_config_priorities={"custom.env": 100}',
		];

		expect(() => runCli(load)).not.toThrow();
		const dotenv = runCli(load) as Dotenv;
		expect(dotenv.debug).toBe(true);

		consoleErrorSpy.mockRestore();
	});

	it("should handle mixed case and malformed CLI arguments", () => {
		process.argv = [
			"node",
			"script.js",
			"DOTENV_CONFIG_DEBUG=true", // Wrong case
			"dotenv_config_=", // Empty option name
			"=value", // No option name
			"dotenv_config_depth=abc", // Invalid number
			"dotenv_config_override=yes", // Invalid boolean
		];

		expect(() => runCli(load)).not.toThrow();
		const dotenv = runCli(load) as Dotenv;
		// Should only parse valid options
		expect(dotenv.depth).toBeNaN(); // Invalid number becomes NaN
		expect(dotenv.override).toBe(false); // Invalid boolean becomes false
	});

	it("should handle environment variables with empty values", () => {
		process.env.DOTENV_CONFIG_PATH = "";
		process.env.DOTENV_CONFIG_DEFAULTS = "";
		process.env.DOTENV_CONFIG_EXTENSION = "";

		expect(() => runCli(load)).not.toThrow();
		const dotenv = runCli(load) as Dotenv;
		expect(dotenv.path).toBe("");
		expect(dotenv.defaults).toBe("");
		expect(dotenv.extension).toBe("");
	});

	it("should handle CLI priority when both env and argv are set", () => {
		// Set environment variables
		process.env.DOTENV_CONFIG_DEBUG = "false";
		process.env.DOTENV_CONFIG_DEPTH = "10";
		process.env.DOTENV_CONFIG_OVERRIDE = "true";

		// Set argv that should override env vars
		process.argv = [
			"node",
			"script.js",
			"dotenv_config_debug=true",
			"dotenv_config_depth=5",
			// Note: not setting override, so env var should be used
		];

		const dotenv = runCli(load) as Dotenv;
		expect(dotenv.debug).toBe(true); // argv wins
		expect(dotenv.depth).toBe(5); // argv wins
		expect(dotenv.override).toBe(true); // env var used since argv not set
	});

	it("should handle complex JSON in CLI arguments", () => {
		// Mock console.error to suppress expected debug output
		const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

		process.argv = [
			"node",
			"script.js",
			'dotenv_config_priorities={"custom.env": 100, "other.env": 50}',
		];

		expect(() => runCli(load)).not.toThrow();
		const dotenv = runCli(load) as Dotenv;
		expect(dotenv.priorities["custom.env"]).toBe(100);
		expect(dotenv.priorities["other.env"]).toBe(50);

		consoleErrorSpy.mockRestore();
	});

	it("should handle malformed JSON in CLI arguments gracefully", () => {
		jest.spyOn(console, "error").mockImplementationOnce(() => {});

		process.argv = ["node", "script.js", 'dotenv_config_priorities={"malformed": json}'];

		expect(() => runCli(load)).not.toThrow();
		const dotenv = runCli(load) as Dotenv;
		// Should use default priorities when JSON parsing fails
		expect(dotenv.priorities[".env"]).toBe(1);
	});

	it("should handle regex special characters in CLI arguments", () => {
		// Mock console.error to suppress expected debug output
		const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

		process.argv = [
			"node",
			"script.js",
			"dotenv_config_path=/path/with[brackets]/.env",
			"dotenv_config_extension=server.test",
		];

		expect(() => runCli(load)).not.toThrow();
		const dotenv = runCli(load) as Dotenv;
		expect(dotenv.path).toBe("/path/with[brackets]/.env");
		expect(dotenv.extension).toBe("server.test");

		consoleErrorSpy.mockRestore();
	});

	it("should handle extremely long CLI arguments", () => {
		// Mock console.error to suppress expected debug output
		const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

		const longPath = "/very/long/path/" + "directory/".repeat(100) + ".env";
		process.argv = ["node", "script.js", `dotenv_config_path=${longPath}`];

		expect(() => runCli(load)).not.toThrow();
		const dotenv = runCli(load) as Dotenv;
		expect(dotenv.path).toBe(longPath);

		consoleErrorSpy.mockRestore();
	});

	it("should handle CLI arguments with unicode characters", () => {
		// Mock console.error to suppress expected debug output
		const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

		process.argv = [
			"node",
			"script.js",
			"dotenv_config_path=/路径/файл/.env",
			"dotenv_config_extension=тест",
		];

		expect(() => runCli(load)).not.toThrow();
		const dotenv = runCli(load) as Dotenv;
		expect(dotenv.path).toBe("/路径/файл/.env");
		expect(dotenv.extension).toBe("тест");

		consoleErrorSpy.mockRestore();
	});

	it("should handle duplicate CLI arguments (last one wins)", () => {
		process.argv = [
			"node",
			"script.js",
			"dotenv_config_debug=false",
			"dotenv_config_depth=1",
			"dotenv_config_debug=true", // This should win
			"dotenv_config_depth=3", // This should win
		];

		const dotenv = runCli(load) as Dotenv;
		expect(dotenv.debug).toBe(true);
		expect(dotenv.depth).toBe(3);
	});
});
