import Dotenv, {dotenvLoad, dotenvConfig, load, config} from "./index";
import mockFs from "mock-fs";

/**
 * Generic object.
 */
type GenericObject<T = unknown> = {[key: string]: T};

describe("Dotenv Mono", () => {
	let instance: Dotenv;
	const originalEnv = process.env;

	const mockEnv = {
		root: "TEST_ROOT_ENV=1",
		overwrite: "TEST_OVERWRITE_ENV=1",
		malformed: "TEST_MALFORMED_ENV",
		malformedWithEol: "TEST_MALFORMED_ENV\r\n",
		defaults: "TEST_DEFAULT_ENV=1",
		webTest: "TEST_WEB_ENV=1",
		parent: "PARENT_ENV=1",
		child: "CHILD_ENV=1",
	};

	beforeEach(() => {
		process.env = {...originalEnv, NODE_ENV: "test"};
		mockFs({
			"/root": {
				".env": mockEnv.root,
				".env.empty": "",
				".env.overwrite": mockEnv.overwrite,
				".env.defaults": mockEnv.defaults,
				".env.malformed": mockEnv.malformed,
				".env.malformed.eol": mockEnv.malformedWithEol,
				"apps": {
					"web": {
						".env.test": mockEnv.webTest,
					},
				},
			},
			"/parent": {
				".env": mockEnv.parent,
				"child": {
					".env": mockEnv.child,
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
		expect(instance.plain).toEqual(mockEnv.webTest);
		expect(instance.env).toEqual(expected);
		expect(process.env).toEqual(expect.objectContaining(expected));
	});

	it("should load the expected environment variables from web directory on production", () => {
		process.env.NODE_ENV = undefined;
		jest.spyOn(process, "cwd").mockReturnValue("/root/apps/web");
		expect(() => instance.load()).not.toThrow();
		const expected = {"TEST_ROOT_ENV": "1", "TEST_DEFAULT_ENV": "1"};
		expect(instance.plain).toEqual(mockEnv.root);
		expect(instance.env).toEqual(expected);
		expect(process.env).toEqual(expect.objectContaining(expected));
	});

	it("should load the expected environment variables from specified path", () => {
		instance.path = "/root/.env.overwrite";
		expect(() => instance.load()).not.toThrow();
		const expected = {"TEST_OVERWRITE_ENV": "1", "TEST_DEFAULT_ENV": "1"};
		expect(instance.plain).toEqual(mockEnv.overwrite);
		expect(instance.env).toEqual(expected);
		expect(process.env).toEqual(expect.objectContaining(expected));
	});

	it("should load the expected environment variables specifying priorities", () => {
		instance.priorities = {
			".env.overwrite": 100,
		};
		expect(() => instance.load()).not.toThrow();
		const expected = {"TEST_OVERWRITE_ENV": "1", "TEST_DEFAULT_ENV": "1"};
		expect(instance.plain).toEqual(mockEnv.overwrite);
		expect(instance.env).toEqual(expected);
		expect(process.env).toEqual(expect.objectContaining(expected));
	});

	it("should load the expected environment variables specifying an extension", () => {
		instance.extension = "overwrite";
		expect(() => instance.load()).not.toThrow();
		const expected = {"TEST_OVERWRITE_ENV": "1", "TEST_DEFAULT_ENV": "1"};
		expect(instance.plain).toEqual(mockEnv.overwrite);
		expect(instance.env).toEqual(expected);
		expect(process.env).toEqual(expect.objectContaining(expected));
	});

	it("should prefer the nearer of two .env files with the same priority", () => {
		jest.spyOn(process, "cwd").mockReturnValue("/parent/child");
		expect(() => instance.load()).not.toThrow();
		const expected = {"CHILD_ENV": "1"};
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
		expect(instance.plain).toEqual(mockEnv.root);
		expect(instance.env).toEqual(expected);
		expect(process.env).not.toEqual(expect.objectContaining(expected));
	});

	it("should have a method save()", () => {
		expect(instance.save).toBeDefined();
	});

	it("should save changes", () => {
		expect(() => instance.loadFile()).not.toThrow();
		const changes = {
			"TEST_ROOT_ENV": "2",
			"TEST_CHANGES_1_ENV": "10",
			"TEST_CHANGES_2_ENV": "enjoy",
			"TEST_CHANGES_3_ENV": "'enjoy quotes'",
		};
		expect(() => instance.save(changes)).not.toThrow();
		expect(instance.plain).toIncludeMultiple(toStringArray(changes));
	});

	it("should save changes on empty dotenv", () => {
		instance.path = "/root/.env.empty";
		const changes = {"TEST_CHANGES_ENV": "1", "TEST_ROOT_ENV": "2"};
		expect(() => instance.loadFile()).not.toThrow();
		expect(() => instance.save(changes)).not.toThrow();
		expect(instance.plain).toIncludeMultiple(toStringArray(changes));
	});

	it("should save changes on malformed dotenv", () => {
		instance.path = "/root/.env.malformed";
		const changes = {"TEST_CHANGES_ENV": "1", "TEST_ROOT_ENV": "2"};
		expect(() => instance.loadFile()).not.toThrow();
		expect(() => instance.save(changes)).not.toThrow();
		expect(instance.plain).toIncludeMultiple(toStringArray(changes));
	});

	it("should save changes on malformed with ends eol dotenv", () => {
		instance.path = "/root/.env.malformed.eol";
		const changes = {"TEST_CHANGES_ENV": "1"};
		expect(() => instance.loadFile()).not.toThrow();
		expect(() => instance.save(changes)).not.toThrow();
		expect(instance.plain).toIncludeMultiple(toStringArray(changes));
	});

	it("should not save changes on not existing file", () => {
		jest.spyOn(process, "cwd").mockReturnValue("/not/");
		instance.path = "/not/.exists";
		const changes = {"TEST_CHANGES_ENV": "1"};
		expect(() => instance.loadFile()).not.toThrow();
		expect(() => instance.save(changes)).not.toThrow();
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

function toStringArray(object: GenericObject): string[] {
	const result: string[] = [];
	Object.entries(object).forEach(([key, value]) => {
		result.push(`${key}=${value}`);
	});
	return result;
}
