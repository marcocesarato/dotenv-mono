import Dotenv, {dotenvLoad, dotenvConfig} from "./index";
import mockFs from "mock-fs";

describe("Dotenv Mono", () => {
	let instance: Dotenv;
	const originalEnv = process.env;

	const rootEnvContent = "TEST_ROOT_ENV=1";
	const defaultsEnvContent = "TEST_DEFAULT_ENV=1";
	const webTestEnvContent = "TEST_WEB_ENV=1";

	beforeEach(() => {
		// Mocks
		process.env = {...originalEnv, NODE_ENV: "test"};
		mockFs({
			"/root": {
				".env": rootEnvContent,
				".env.defaults": defaultsEnvContent,
				"apps": {
					"web": {
						".env.test": webTestEnvContent,
					},
				},
			},
		});
		jest.spyOn(process, "cwd").mockReturnValue("/root/apps");
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

	it("should load the expected environment variables from web directory", () => {
		expect(instance.load).toBeDefined();
		jest.spyOn(process, "cwd").mockReturnValue("/root/apps/web");
		expect(() => instance.load()).not.toThrow();
		const expected = {
			"TEST_WEB_ENV": "1",
			"TEST_DEFAULT_ENV": "1",
		};
		expect(instance.plain).toEqual(webTestEnvContent);
		expect(instance.env).toEqual(expected);
		Object.keys(expected).forEach((key) => {
			expect(process.env).toHaveProperty(key);
		});
	});

	it("should load the expected environment variables from web directory on production", () => {
		expect(instance.load).toBeDefined();
		process.env = {...process.env, NODE_ENV: "production"};
		jest.spyOn(process, "cwd").mockReturnValue("/root/apps/web");
		expect(() => instance.load()).not.toThrow();
		const expected = {
			"TEST_ROOT_ENV": "1",
			"TEST_DEFAULT_ENV": "1",
		};
		expect(instance.plain).toEqual(rootEnvContent);
		expect(instance.env).toEqual(expected);
		Object.keys(expected).forEach((key) => {
			expect(process.env).toHaveProperty(key);
		});
	});

	it("should have a method loadFile() and load file without change the process env", () => {
		expect(instance.loadFile).toBeDefined();
		expect(() => instance.loadFile()).not.toThrow();
		const expected = {
			"TEST_ROOT_ENV": "1",
			"TEST_DEFAULT_ENV": "1",
		};
		expect(instance.plain).toEqual(rootEnvContent);
		expect(instance.env).not.toEqual(expected);
		Object.keys(expected).forEach((key) => {
			expect(process.env).not.toHaveProperty(key);
		});
	});

	it("should have a method save() and save changes without throw errors", () => {
		expect(instance.loadFile).toBeDefined();
		expect(instance.save).toBeDefined();
		expect(() => instance.loadFile()).not.toThrow();
		expect(() =>
			instance.save({
				"TEST_ROOT_ENV": "2",
				"TEST_CHANGES_ENV": "1",
			}),
		).not.toThrow();
		expect(instance.plain).toContain("TEST_ROOT_ENV=2");
		expect(instance.plain).toContain("TEST_CHANGES_ENV=1");
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
