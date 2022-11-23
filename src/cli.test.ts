import {OptionType, parseOption, runCli} from "./cli";
import {config, Dotenv, load} from "./index";
import mockFs from "mock-fs";

describe("runCli", () => {
	const originalEnv = process.env;

	beforeEach(() => {
		process.env = {...originalEnv, NODE_ENV: "test"};
		mockFs({"/root/.env": "TEST_ROOT_ENV=1"});
		jest.spyOn(process, "cwd").mockReturnValue("/root/apps");
	});

	afterEach(() => {
		jest.resetModules();
		mockFs.restore();
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
		expect(dotenv.env).not.toBeEmptyObject();

		const output = runCli(config);
		expect(output).toHaveProperty("parsed");
		expect(output.parsed).not.toBeEmptyObject();
	});

	it("runCli should return the expected output using environmental options", () => {
		process.env.DOTENV_CONFIG_DEBUG = "true";
		const dotenv = runCli(load);
		expect(dotenv instanceof Dotenv).toBeTruthy();
		expect(dotenv.env).not.toBeEmptyObject();
	});

	it("runCli should return the expected output using argv options", () => {
		process.argv = ["dotenv_config_debug=true"];
		const dotenv = runCli(load);
		expect(dotenv instanceof Dotenv).toBeTruthy();
		expect(dotenv.env).not.toBeEmptyObject();
	});
});

describe("parseOption", () => {
	it("should expose a function", () => {
		expect(parseOption).toBeDefined();
	});

	it("parseOption should return expected output", () => {
		expect(parseOption).toBeDefined();
		expect(parseOption(undefined, OptionType.number)).toBeUndefined();
		expect(parseOption("1", OptionType.number)).toEqual(1);
		expect(parseOption("true", OptionType.boolean)).toBeTrue();
		expect(parseOption("false", OptionType.boolean)).toBeFalse();
		expect(parseOption("message", OptionType.string)).toEqual("message");
		expect(parseOption('{"value": 1}', OptionType.object)).toEqual({"value": 1});
		expect(parseOption("[1, 2]", OptionType.array)).toEqual([1, 2]);
		// Malformed JSON parsing
		jest.spyOn(console, "error").mockImplementationOnce(() => {});
		expect(parseOption('{"malformed": 1]]', OptionType.object)).toEqual('{"malformed": 1]]');
	});
});
