import {OptionType, parseOption, runCli} from "./cli";
import {config, Dotenv, load} from "./index";

describe("runCli", () => {
	const originalEnv = process.env;

	beforeEach(() => {
		process.env = {...originalEnv, NODE_ENV: "test"};
	});

	it("should expose a function", () => {
		expect(runCli).toBeDefined();
	});

	it("runCli should not throw errors", () => {
		expect(() => runCli(load)).not.toThrow();
		expect(() => runCli(config)).not.toThrow();
	});

	it("runCli should return the expected output", () => {
		const dotenv = runCli(load);
		expect(dotenv instanceof Dotenv).toBeTruthy();

		const output = runCli(config);
		expect(output).toHaveProperty("parsed");
	});

	it("runCli should return the expected output using environmental options", () => {
		process.env.DOTENV_CONFIG_DEBUG = "true";
		const dotenv = runCli(load);
		expect(dotenv instanceof Dotenv).toBeTruthy();
	});

	it("runCli should return the expected output using argv options", () => {
		process.argv = ["dotenv_config_debug=true"];
		const dotenv = runCli(load);
		expect(dotenv instanceof Dotenv).toBeTruthy();
	});
});

describe("parseOption", () => {
	it("should expose a function", () => {
		expect(parseOption).toBeDefined();
	});

	it("parseOption should return expected output", () => {
		expect(parseOption(undefined, OptionType.number) === undefined).toBeTruthy();
		expect(parseOption("1", OptionType.number) === 1).toBeTruthy();
		expect(parseOption("true", OptionType.boolean) === true).toBeTruthy();
		expect(parseOption("false", OptionType.boolean) === false).toBeTruthy();
		expect(parseOption("message", OptionType.string) === "message").toBeTruthy();
		expect(typeof parseOption('{"value": 1}', OptionType.object) === "object").toBeTruthy();
		expect(Array.isArray(parseOption("[1, 2]", OptionType.array))).toBeTruthy();
		// Malformed JSON parsing
		jest.spyOn(console, "error").mockImplementationOnce(() => {});
		expect(typeof parseOption('{"malformed": 1]', OptionType.object) === "string").toBeTruthy();
	});
});
