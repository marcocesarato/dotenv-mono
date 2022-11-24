import Dotenv, {dotenvLoad, dotenvConfig, load, config} from "./index";
import mockFs from "mock-fs";

describe("Dotenv Mono", () => {
	let instance: Dotenv;
	const originalEnv = process.env;

	const rootContent = "TEST_ROOT_ENV=1";
	const overwriteContent = "TEST_OVERWRITE_ENV=1";
	const malformedContent = "TEST_MALFORMED_ENV";
	const malformedEolContent = "TEST_MALFORMED_ENV\r\n";
	const defaultsContent = "TEST_DEFAULT_ENV=1";
	const webTestContent = "TEST_WEB_ENV=1";

	beforeEach(() => {
		process.env = {...originalEnv, NODE_ENV: "test"};
		mockFs({
			"/root": {
				".env": rootContent,
				".env.empty": "",
				".env.overwrite": overwriteContent,
				".env.defaults": defaultsContent,
				".env.malformed": malformedContent,
				".env.malformed.eol": malformedEolContent,
				"apps": {
					"web": {
						".env.test": webTestContent,
					},
				},
			},
		});
		jest.spyOn(process, "cwd").mockReturnValue("/root/apps");
		instance = new Dotenv({
			defaults: ".env.defaults",
			encoding: "utf8",
			expand: true,
			override: false,
		});
	});

	afterEach(() => {
		jest.resetModules();
		mockFs.restore();
	});

	it("should have config options", () => {
		expect(instance.cwd).toBeDefined();
		expect(instance.debug).toBeDefined();
		expect(instance.defaults).toBeDefined();
		expect(instance.depth).toBeDefined();
		expect(instance.encoding).toBeDefined();
		expect(instance.expand).toBeDefined();
		expect(instance.extension).toBeDefined();
		expect(instance.override).toBeDefined();
		expect(instance.path).toBeDefined();
		expect(instance.priorities).toBeDefined();
	});

	it("should have a method parse()", () => {
		expect(instance.parse).toBeDefined();
	});

	it("should parse a dotenv string", () => {
		const output = instance.parse("TEST_PARSE_1: 1\nTEST_PARSE_2: 2");
		expect(output).toEqual({"TEST_PARSE_1": "1", "TEST_PARSE_2": "2"});
	});

	it("should have a method load()", () => {
		expect(instance.load).toBeDefined();
	});

	it("should load the expected environment variables from web directory", () => {
		jest.spyOn(process, "cwd").mockReturnValue("/root/apps/web");
		expect(() => instance.load()).not.toThrow();
		const expected = {"TEST_WEB_ENV": "1", "TEST_DEFAULT_ENV": "1"};
		expect(instance.plain).toEqual(webTestContent);
		expect(instance.env).toEqual(expected);
		expect(process.env).toEqual(expect.objectContaining(expected));
	});

	it("should load the expected environment variables from web directory on production", () => {
		process.env.NODE_ENV = undefined;
		jest.spyOn(process, "cwd").mockReturnValue("/root/apps/web");
		expect(() => instance.load()).not.toThrow();
		const expected = {"TEST_ROOT_ENV": "1", "TEST_DEFAULT_ENV": "1"};
		expect(instance.plain).toEqual(rootContent);
		expect(instance.env).toEqual(expected);
		expect(process.env).toEqual(expect.objectContaining(expected));
	});

	it("should load the expected environment variables from specified path", () => {
		instance.path = "/root/.env.overwrite";
		expect(() => instance.load()).not.toThrow();
		const expected = {"TEST_OVERWRITE_ENV": "1", "TEST_DEFAULT_ENV": "1"};
		expect(instance.plain).toEqual(overwriteContent);
		expect(instance.env).toEqual(expected);
		expect(process.env).toEqual(expect.objectContaining(expected));
	});

	it("should load the expected environment variables specifying priorities", () => {
		instance.priorities = {
			".env.overwrite": 100,
		};
		expect(() => instance.load()).not.toThrow();
		const expected = {"TEST_OVERWRITE_ENV": "1", "TEST_DEFAULT_ENV": "1"};
		expect(instance.plain).toEqual(overwriteContent);
		expect(instance.env).toEqual(expected);
		expect(process.env).toEqual(expect.objectContaining(expected));
	});

	it("should load the expected environment variables specifying an extension", () => {
		instance.extension = "overwrite";
		expect(() => instance.load()).not.toThrow();
		const expected = {"TEST_OVERWRITE_ENV": "1", "TEST_DEFAULT_ENV": "1"};
		expect(instance.plain).toEqual(overwriteContent);
		expect(instance.env).toEqual(expected);
		expect(process.env).toEqual(expect.objectContaining(expected));
	});

	it("should load returns an empty output when none dotenv been found", () => {
		jest.spyOn(process, "cwd").mockReturnValue("/empty");
		instance.cwd = process.cwd();
		expect(() => instance.load()).not.toThrow();
		expect(instance.plain).toBeEmpty();
		expect(instance.env).toBeEmptyObject();
	});

	it("should load returns an empty output when the current working directory is too deep to reach dotenv", () => {
		jest.spyOn(process, "cwd").mockReturnValue("/root/path/too/deep/");
		instance.depth = 2;
		instance.cwd = process.cwd();
		expect(() => instance.load()).not.toThrow();
		expect(instance.plain).toBeEmpty();
		expect(instance.env).toBeEmptyObject();
	});

	it("should load returns an empty output when the specified file dotenv not been found", () => {
		instance.path = "/wrong/.env";
		jest.spyOn(process, "cwd").mockReturnValue("/wrong");
		expect(() => instance.load()).not.toThrow();
		expect(instance.plain).toBeEmpty();
		expect(instance.env).toBeEmptyObject();
	});

	it("should have a method loadFile() and load file without change the process env", () => {
		expect(instance.loadFile).toBeDefined();
		expect(() => instance.loadFile()).not.toThrow();
		const expected = {"TEST_ROOT_ENV": "1", "TEST_DEFAULT_ENV": "1"};
		expect(instance.plain).toEqual(rootContent);
		expect(instance.env).not.toEqual(expected);
		expect(process.env).not.toEqual(expect.objectContaining(expected));
	});

	it("should have a method save()", () => {
		expect(instance.save).toBeDefined();
	});

	it("should save changes", () => {
		expect(() => instance.loadFile()).not.toThrow();
		expect(() => instance.save({"TEST_CHANGES_ENV": "1", "TEST_ROOT_ENV": "2"})).not.toThrow();
		expect(instance.plain).toIncludeMultiple(["TEST_CHANGES_ENV=1", "TEST_ROOT_ENV=2"]);
	});

	it("should save changes on empty dotenv", () => {
		instance.path = "/root/.env.empty";
		expect(() => instance.loadFile()).not.toThrow();
		expect(() => instance.save({"TEST_CHANGES_ENV": "1", "TEST_ROOT_ENV": "2"})).not.toThrow();
		expect(instance.plain).toIncludeMultiple(["TEST_CHANGES_ENV=1", "TEST_ROOT_ENV=2"]);
	});

	it("should save changes on malformed dotenv", () => {
		instance.path = "/root/.env.malformed";
		expect(() => instance.loadFile()).not.toThrow();
		expect(() => instance.save({"TEST_CHANGES_ENV": "1", "TEST_ROOT_ENV": "2"})).not.toThrow();
		expect(instance.plain).toIncludeMultiple(["TEST_CHANGES_ENV=1", "TEST_ROOT_ENV=2"]);
	});

	it("should save changes on malformed with ends eol dotenv", () => {
		instance.path = "/root/.env.malformed.eol";
		expect(() => instance.loadFile()).not.toThrow();
		expect(() => instance.save({"TEST_CHANGES_ENV": "1"})).not.toThrow();
		expect(instance.plain).toInclude("TEST_CHANGES_ENV=1");
	});

	it("should not save changes on not existing file", () => {
		jest.spyOn(process, "cwd").mockReturnValue("/not/");
		instance.path = "/not/.exists";
		expect(() => instance.loadFile()).not.toThrow();
		expect(() => instance.save({"TEST_CHANGES_ENV": "1"})).not.toThrow();
		expect(instance.plain).toBeEmpty();
	});

	it("should expose dotenvLoad() function", () => {
		expect(dotenvLoad).toBeDefined();
	});

	it("should expose load() function", () => {
		expect(load).toBeDefined();
	});

	it("should dotenvLoad() return expected output", () => {
		const dotenv = dotenvLoad();
		expect(dotenv.env).not.toBeEmptyObject();
	});

	it("should expose dotenvConfig() function", () => {
		expect(dotenvConfig).toBeDefined();
	});

	it("should expose config() function", () => {
		expect(config).toBeDefined();
	});

	it("should dotenvConfig() return expected output", () => {
		const output = dotenvConfig();
		expect(output).toHaveProperty("parsed");
		expect(output.parsed).not.toBeEmptyObject();
	});
});
