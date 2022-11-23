import {runCli} from "./cli";
import {Dotenv, load, config} from "./index";

describe("runCli", () => {
	it("should expose a function", () => {
		expect(runCli).toBeDefined();
	});

	it("runCli should not throw errors", () => {
		expect(() => runCli(load)).not.toThrow();
		expect(() => runCli(config)).not.toThrow();
	});

	it("runCli should returns the expected type value", () => {
		const dotenv = runCli(load);
		expect(dotenv instanceof Dotenv).toBeTruthy();

		const output = runCli(config);
		expect(output).toHaveProperty("parsed");
	});
});
