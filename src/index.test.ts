import Dotenv, {dotenvLoad, dotenvConfig} from "./index";
import mockFs from "mock-fs";

describe("Dotenv Mono", () => {
	let instance: Dotenv;
	const originalEnv = process.env;

	const rootEnv = "TEST_ROOT_ENV: 1";
	const defaultsEnv = "TEST_DEFAULT_ENV: 1";
	const webTestEnv = "TEST_WEB_ENV: 1";

	beforeEach(() => {
		// Mocks
		process.env = {...originalEnv, NODE_ENV: "test"};
		mockFs({
			"/root": {
				".env": rootEnv,
				".env.defaults": defaultsEnv,
				"apps": {
					"web": {
						".env.test": webTestEnv,
					},
				},
			},
		});
		// Setup
		instance = new Dotenv();
	});

	afterEach(() => {
		// Reset
		jest.resetModules();
		mockFs.restore();
	});

	it("should have a method parse() and parse a dotenv string", () => {
		expect(instance.parse).toBeDefined();
		const output = instance.parse("TEST_PARSE_1: 1\nTEST_PARSE_2: 2");
		expect(output).toEqual({
			"TEST_PARSE_1": "1",
			"TEST_PARSE_2": "2",
		});
	});

	it("should have a method load()", () => {
		expect(instance.load).toBeDefined();
	});

	it("should load the expected environment variables from apps directory", () => {
		expect(instance.load).toBeDefined();
		jest.spyOn(process, "cwd").mockReturnValue("/root/apps");
		expect(() => instance.load()).not.toThrow();
		const expected = {
			"TEST_ROOT_ENV": "1",
			"TEST_DEFAULT_ENV": "1",
		};
		expect(instance.plain).toEqual(rootEnv);
		expect(instance.env).toEqual(expected);
		Object.keys(expected).forEach((key) => {
			expect(process.env).toHaveProperty(key);
		});
	});

	it("should load the expected environment variables from web directory", () => {
		expect(instance.load).toBeDefined();
		jest.spyOn(process, "cwd").mockReturnValue("/root/apps/web");
		expect(() => instance.load()).not.toThrow();
		const expected = {
			"TEST_WEB_ENV": "1",
			"TEST_DEFAULT_ENV": "1",
		};
		expect(instance.plain).toEqual(webTestEnv);
		expect(instance.env).toEqual(expected);
		Object.keys(expected).forEach((key) => {
			expect(process.env).toHaveProperty(key);
		});
	});

	it("should have a method loadFile() and load file without change the process env", () => {
		expect(instance.loadFile).toBeDefined();
		jest.spyOn(process, "cwd").mockReturnValue("/root/apps");
		expect(() => instance.loadFile()).not.toThrow();
		const expected = {
			"TEST_ROOT_ENV": "1",
			"TEST_DEFAULT_ENV": "1",
		};
		expect(instance.plain).toEqual(rootEnv);
		expect(instance.env).not.toEqual(expected);
		Object.keys(expected).forEach((key) => {
			expect(process.env).not.toHaveProperty(key);
		});
	});

	it("should have a method save() and save changes without throw errors", () => {
		instance.loadFile();
		expect(() =>
			instance.save({
				"TEST_CHANGES_ENV": "1",
			}),
		).not.toThrow();
		expect(instance.save).toBeDefined();
	});

	it("should expose a function", () => {
		expect(dotenvLoad).toBeDefined();
	});

	it("dotenvLoad should return expected output", () => {
		const retValue = dotenvLoad();
		expect(retValue).toBeDefined();
	});

	it("should expose a function", () => {
		expect(dotenvConfig).toBeDefined();
	});

	it("dotenvConfig should return expected output", () => {
		const retValue = dotenvConfig();
		expect(retValue).toBeDefined();
	});
});
