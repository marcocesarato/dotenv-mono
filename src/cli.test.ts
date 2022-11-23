import {OptionType, parseOption, runCli} from "./cli";
import {config, Dotenv, load} from "./index";

describe("runCli", () => {
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
});

describe("parseOption", () => {
	it("should expose a function", () => {
		expect(parseOption).toBeDefined();
	});

	it("parseOption should return expected output", () => {
		expect(parseOption("1", OptionType.number) === 1).toBeTruthy();
		expect(parseOption("true", OptionType.boolean) === true).toBeTruthy();
		expect(parseOption("false", OptionType.boolean) === false).toBeTruthy();
		expect(parseOption("message", OptionType.string) === "message").toBeTruthy();
		expect(typeof parseOption('{"value": 1}', OptionType.object) === "object").toBeTruthy();
		expect(Array.isArray(parseOption("[1, 2]", OptionType.array))).toBeTruthy();
	});
});
