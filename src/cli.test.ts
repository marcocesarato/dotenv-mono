import {runCli} from "./cli";
import {load} from "./index";

jest.mock("./index");

describe("runCli", () => {
	it("should expose a function", () => {
		expect(runCli).toBeDefined();
	});

	it("runCli should not throw errors", () => {
		expect(() => runCli(load)).not.toThrow();
	});
});
