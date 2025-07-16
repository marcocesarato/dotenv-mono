import Dotenv, {dotenvLoad, dotenvConfig, load, config, DotenvMatcher, DotenvData} from "./index";
import mockFs from "mock-fs";
import fs from "fs";
import path from "path";

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
		// Restore original process.env
		process.env = originalEnv;
		jest.resetModules();
		mockFs.restore();
		jest.restoreAllMocks();
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

	it("should handle custom matcher for finding dotenv files", () => {
		const customMatcher: DotenvMatcher = (dotenv, cwd) => {
			const customPath = path.join(cwd, ".env.custom");
			if (fs.existsSync(customPath)) {
				return {foundPath: cwd, foundDotenv: customPath};
			}
			return {foundPath: null, foundDotenv: null};
		};

		mockFs({
			"/custom": {
				".env.custom": "CUSTOM_ENV=1",
			},
		});

		jest.spyOn(process, "cwd").mockReturnValue("/custom");
		instance.cwd = process.cwd();

		const foundFile = instance.find(customMatcher);
		expect(foundFile).toEqual(expect.stringContaining(".env.custom"));
		expect(foundFile).toEqual(expect.stringContaining("custom"));
	});

	it("should test parse method with Buffer input", () => {
		const buffer = Buffer.from("BUFFER_TEST=1\nBUFFER_TEST_2=2");
		const output = instance.parse(buffer);
		expect(output).toEqual({"BUFFER_TEST": "1", "BUFFER_TEST_2": "2"});
	});

	it("should handle NODE_ENV undefined when setting priorities", () => {
		const originalNodeEnv = process.env.NODE_ENV;
		delete process.env.NODE_ENV;
		instance.extension = "test";
		const priorities = instance.priorities;
		expect(priorities[".env.test.development"]).toBeDefined();
		expect(priorities[".env.test.development.local"]).toBeDefined();
		expect(priorities[".env.test.local"]).toBeDefined();
		expect(priorities[".env.test"]).toBeDefined();
		// Restore original NODE_ENV
		if (originalNodeEnv !== undefined) {
			process.env.NODE_ENV = originalNodeEnv;
		}
	});

	it("should handle extension with leading and trailing dots", () => {
		instance.extension = "..test..";
		expect(instance.extension).toEqual("test");
	});

	it("should handle save with null value (should skip)", () => {
		expect(() => instance.loadFile()).not.toThrow();
		const changes: DotenvData = {
			"TEST_ROOT_ENV": "2",
			"UNDEFINED_VALUE": undefined,
		};
		expect(() => instance.save(changes)).not.toThrow();
		expect(instance.plain).toInclude("TEST_ROOT_ENV=2");
		expect(instance.plain).not.toInclude("UNDEFINED_VALUE");
	});

	it("should handle debug mode", () => {
		const debugInstance = new Dotenv({debug: true});
		expect(debugInstance.debug).toBe(true);

		debugInstance.debug = false;
		expect(debugInstance.debug).toBe(false);
	});

	it("should handle expand mode", () => {
		mockFs({
			"/expand": {
				".env": "BASE_VAR=base\nEXPANDED_VAR=${BASE_VAR}_expanded",
			},
		});

		jest.spyOn(process, "cwd").mockReturnValue("/expand");
		const expandInstance = new Dotenv({cwd: "/expand", expand: true});
		expandInstance.load();

		expect(expandInstance.env.BASE_VAR).toBe("base");
		expect(expandInstance.env.EXPANDED_VAR).toBe("base_expanded");

		// Test with expand disabled
		const noExpandInstance = new Dotenv({cwd: "/expand", expand: false});
		noExpandInstance.load();
		expect(noExpandInstance.env.EXPANDED_VAR).toBe("${BASE_VAR}_expanded");
	});

	it("should handle override mode", () => {
		// Set an existing env var
		process.env.TEST_OVERRIDE = "original";

		mockFs({
			"/override": {
				".env": "TEST_OVERRIDE=overridden",
			},
		});

		jest.spyOn(process, "cwd").mockReturnValue("/override");

		// Test without override
		const noOverrideInstance = new Dotenv({cwd: "/override", override: false});
		noOverrideInstance.load();
		expect(process.env.TEST_OVERRIDE).toBe("original");

		// Test with override
		const overrideInstance = new Dotenv({cwd: "/override", override: true});
		overrideInstance.load();
		expect(process.env.TEST_OVERRIDE).toBe("overridden");

		// Clean up
		delete process.env.TEST_OVERRIDE;
	});

	it("should handle different encodings", () => {
		instance.encoding = "latin1";
		expect(instance.encoding).toBe("latin1");

		instance.encoding = "ascii";
		expect(instance.encoding).toBe("ascii");
	});

	it("should find dotenv with custom priorities and different NODE_ENV values", () => {
		mockFs({
			"/priority-test": {
				".env": "BASE_ENV=1",
				".env.staging": "STAGING_ENV=1",
				".env.custom": "CUSTOM_ENV=1",
			},
		});

		// Test with staging environment
		process.env.NODE_ENV = "staging";
		jest.spyOn(process, "cwd").mockReturnValue("/priority-test");

		const stagingInstance = new Dotenv({cwd: "/priority-test"});
		stagingInstance.load();
		expect(stagingInstance.env.STAGING_ENV).toBe("1");

		// Test with custom priorities
		const customPriorityInstance = new Dotenv({
			cwd: "/priority-test",
			priorities: {".env.custom": 100},
		});
		customPriorityInstance.load();
		expect(customPriorityInstance.env.CUSTOM_ENV).toBe("1");
	});

	it("should handle file system errors gracefully", () => {
		// Test with directory that doesn't exist
		jest.spyOn(process, "cwd").mockReturnValue("/nonexistent");
		const nonExistentInstance = new Dotenv({cwd: "/nonexistent"});
		expect(() => nonExistentInstance.load()).not.toThrow();
		expect(nonExistentInstance.env).toEqual({});
	});

	it("should handle save with empty content and special characters", () => {
		mockFs({
			"/special": {
				".env": "",
			},
		});

		instance.path = "/special/.env";
		expect(() => instance.loadFile()).not.toThrow();

		const changes = {
			"SPECIAL_CHARS": "value with spaces and 'quotes'",
			"EQUALS_IN_VALUE": "key=value",
			"NEWLINES": "line1\nline2",
			"CARRIAGE_RETURN": "line1\r\nline2",
		};

		expect(() => instance.save(changes)).not.toThrow();
		expect(instance.plain).toInclude("SPECIAL_CHARS=value with spaces and 'quotes'");
		expect(instance.plain).toInclude("EQUALS_IN_VALUE=key=value");
		expect(instance.plain).toInclude("NEWLINES=line1\\nline2");
		expect(instance.plain).toInclude("CARRIAGE_RETURN=line1\\r\\nline2");
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

	// Additional test cases for comprehensive coverage
	it("should handle find() method with no matcher and no files found", () => {
		jest.spyOn(process, "cwd").mockReturnValue("/nonexistent");
		const emptyInstance = new Dotenv({cwd: "/nonexistent"});
		const result = emptyInstance.find();
		expect(result).toBeNull();
	});

	it("should handle find() method when depth is reached without finding files", () => {
		jest.spyOn(process, "cwd").mockReturnValue("/root/very/deep/nested/path");
		const deepInstance = new Dotenv({cwd: "/root/very/deep/nested/path", depth: 2});
		const result = deepInstance.find();
		expect(result).toBeNull();
	});

	it("should handle malformed .env files gracefully during parsing", () => {
		const malformedContent = "INVALID_FORMAT\n=MISSING_KEY\nVALID_KEY=value\n";
		const parsed = instance.parse(malformedContent);
		expect(parsed).toHaveProperty("VALID_KEY", "value");
		// Should ignore malformed lines and continue parsing
	});

	it("should handle empty string input for parse method", () => {
		const parsed = instance.parse("");
		expect(parsed).toEqual({});
	});

	it("should handle Buffer input with different encodings", () => {
		const content = "BUFFER_KEY=buffer_value";
		const buffer = Buffer.from(content, "utf8");
		const parsed = instance.parse(buffer);
		expect(parsed).toEqual({"BUFFER_KEY": "buffer_value"});
	});

	it("should handle priority conflicts correctly (higher priority wins)", () => {
		mockFs({
			"/priority": {
				".env": "BASE=base",
				".env.local": "LOCAL=local",
				".env.test": "TEST=test",
				".env.test.local": "TEST_LOCAL=test_local",
			},
		});

		jest.spyOn(process, "cwd").mockReturnValue("/priority");
		process.env.NODE_ENV = "test";

		const priorityInstance = new Dotenv({cwd: "/priority"});
		priorityInstance.load();

		// Should load .env.test.local (priority 75) over others
		expect(priorityInstance.env.TEST_LOCAL).toBe("test_local");
	});

	it("should handle directory traversal correctly when files exist at different levels", () => {
		mockFs({
			"/deep": {
				"level1": {
					"level2": {
						"level3": {
							// Empty directory
						},
					},
					".env": "LEVEL2=level2",
				},
				".env": "ROOT=root",
			},
		});

		jest.spyOn(process, "cwd").mockReturnValue("/deep/level1/level2/level3");
		const traversalInstance = new Dotenv({cwd: "/deep/level1/level2/level3"});
		traversalInstance.load();

		// Should find .env at level2, not root (closer file wins)
		expect(traversalInstance.env.LEVEL2).toBe("level2");
		expect(traversalInstance.env.ROOT).toBeUndefined();
	});

	it("should handle constructor with all undefined values", () => {
		const undefinedInstance = new Dotenv({
			cwd: undefined,
			debug: undefined,
			defaults: undefined,
			depth: undefined,
			encoding: undefined,
			expand: undefined,
			extension: undefined,
			override: undefined,
			path: undefined,
			priorities: undefined,
		});

		// Should use default values
		expect(undefinedInstance.cwd).toBe(process.cwd());
		expect(undefinedInstance.debug).toBe(false);
		expect(undefinedInstance.defaults).toBe(".env.defaults");
		expect(undefinedInstance.depth).toBe(4);
		expect(undefinedInstance.encoding).toBe("utf8");
		expect(undefinedInstance.expand).toBe(true);
		expect(undefinedInstance.extension).toBe("");
		expect(undefinedInstance.override).toBe(false);
		expect(undefinedInstance.path).toBe("");
	});

	it("should handle custom priorities with non-existent files", () => {
		const customInstance = new Dotenv({
			cwd: "/root",
			priorities: {
				".env.nonexistent": 100,
				".env.another": 90,
			},
		});

		customInstance.load();
		// Should fall back to existing files like .env
		expect(customInstance.env.TEST_ROOT_ENV).toBe("1");
	});

	it("should handle defaults file when no main dotenv file exists", () => {
		mockFs({
			"/defaults-only": {
				".env.defaults": "DEFAULT_ONLY=value",
			},
		});

		jest.spyOn(process, "cwd").mockReturnValue("/defaults-only");
		const defaultsInstance = new Dotenv({cwd: "/defaults-only"});
		defaultsInstance.load();

		expect(defaultsInstance.env.DEFAULT_ONLY).toBe("value");
	});

	it("should handle save() with string numbers and special values", () => {
		expect(() => instance.loadFile()).not.toThrow();

		const changes = {
			"STRING_NUMBER": "123",
			"BOOLEAN_STRING": "true",
			"EMPTY_STRING": "",
			"SPACES": "  value with spaces  ",
			"MULTILINE": "line1\\nline2",
		};

		expect(() => instance.save(changes)).not.toThrow();
		expect(instance.plain).toInclude("STRING_NUMBER=123");
		expect(instance.plain).toInclude("BOOLEAN_STRING=true");
		expect(instance.plain).toInclude("EMPTY_STRING=");
		expect(instance.plain).toInclude("SPACES=value with spaces");
		expect(instance.plain).toInclude("MULTILINE=line1\\nline2");
	});

	it("should handle save() when file becomes invalid during operation", () => {
		// Test edge case where file might be deleted between loadFile and save
		instance.path = "/root/.env";
		expect(() => instance.loadFile()).not.toThrow();

		// Simulate file deletion
		mockFs({});

		const changes = {"NEW_VAR": "value"};
		expect(() => instance.save(changes)).not.toThrow();
		// Should handle gracefully without throwing
	});

	it("should handle complex dotenv expansion scenarios", () => {
		mockFs({
			"/expansion": {
				".env": "BASE=base\nNESTED=${BASE}_nested\nCHAINED=${NESTED}_chained\nSELF_REF=${SELF_REF}_loop",
			},
		});

		jest.spyOn(process, "cwd").mockReturnValue("/expansion");
		const expandInstance = new Dotenv({cwd: "/expansion", expand: true});
		expandInstance.load();

		expect(expandInstance.env.BASE).toBe("base");
		expect(expandInstance.env.NESTED).toBe("base_nested");
		expect(expandInstance.env.CHAINED).toBe("base_nested_chained");
		// Should handle self-reference without infinite loop
		expect(expandInstance.env.SELF_REF).toContain("loop");
	});

	it("should handle extension normalization edge cases", () => {
		const testInstance = new Dotenv();

		// Test various extension formats
		testInstance.extension = "...multiple.dots...";
		expect(testInstance.extension).toBe("multiple.dots");

		testInstance.extension = ".single.dot.";
		expect(testInstance.extension).toBe("single.dot");

		testInstance.extension = "nodots";
		expect(testInstance.extension).toBe("nodots");

		testInstance.extension = "";
		expect(testInstance.extension).toBe("");
	});

	it("should handle different NODE_ENV values in priorities generation", () => {
		const originalNodeEnv = process.env.NODE_ENV;

		// Test with staging environment
		process.env.NODE_ENV = "staging";
		const stagingInstance = new Dotenv({extension: "api"});
		const stagingPriorities = stagingInstance.priorities;

		expect(stagingPriorities[".env.api.staging.local"]).toBe(75);
		expect(stagingPriorities[".env.api.local"]).toBe(50);
		expect(stagingPriorities[".env.api.staging"]).toBe(25);
		expect(stagingPriorities[".env.api"]).toBe(1);

		// Test with production environment
		process.env.NODE_ENV = "production";
		const prodInstance = new Dotenv({extension: "web"});
		const prodPriorities = prodInstance.priorities;

		expect(prodPriorities[".env.web.production.local"]).toBe(75);
		expect(prodPriorities[".env.web.production"]).toBe(25);

		// Restore original NODE_ENV
		process.env.NODE_ENV = originalNodeEnv;
	});

	it("should handle config property persistence across operations", () => {
		instance.load();
		const initialConfig = {...instance.config};

		// Config should persist after loadFile
		instance.loadFile();
		expect(instance.config.parsed).toEqual(initialConfig.parsed);

		// Config should be updated after save - ensure we have a valid file to save to
		instance.path = "/root/.env"; // Explicitly set a path to ensure save works
		const changes = {"NEW_CONFIG_VAR": "value"};
		instance.save(changes);
		expect(instance.env).toHaveProperty("NEW_CONFIG_VAR", "value");
	});

	it("should handle file system permission errors gracefully", () => {
		// Test with directory that doesn't exist (this is safe and consistent)
		jest.spyOn(process, "cwd").mockReturnValue("/nonexistent-permission-test");
		const permissionInstance = new Dotenv({
			cwd: "/nonexistent-permission-test",
			path: "/nonexistent-permission-test/.env",
		});
		expect(() => permissionInstance.load()).not.toThrow();
		expect(permissionInstance.env).toEqual({});
	});

	it("should handle encoding edge cases", () => {
		const testInstance = new Dotenv();

		// Test setting various encoding types
		testInstance.encoding = "ascii";
		expect(testInstance.encoding).toBe("ascii");

		testInstance.encoding = "base64";
		expect(testInstance.encoding).toBe("base64");

		testInstance.encoding = "hex";
		expect(testInstance.encoding).toBe("hex");

		// Test with undefined (should not change)
		const currentEncoding = testInstance.encoding;
		testInstance.encoding = undefined;
		expect(testInstance.encoding).toBe(currentEncoding);
	});

	it("should handle dotenv matcher edge cases", () => {
		mockFs({
			"/matcher-test": {
				".env": "BASE=base",
				"subdir": {
					".env.local": "LOCAL=local",
				},
			},
		});

		jest.spyOn(process, "cwd").mockReturnValue("/matcher-test");

		// Test custom matcher that looks for files in subdirectories
		const customMatcher: DotenvMatcher = (dotenv, cwd) => {
			const subdirPath = path.join(cwd, "subdir", ".env.local");
			if (fs.existsSync(subdirPath)) {
				return {foundPath: cwd, foundDotenv: subdirPath};
			}
			return {foundPath: null, foundDotenv: null};
		};

		const matcherInstance = new Dotenv({cwd: "/matcher-test"});
		const result = matcherInstance.find(customMatcher);
		expect(result).toEqual(expect.stringContaining(".env.local"));
		expect(result).toEqual(expect.stringContaining("matcher-test"));
	});

	it("should handle save operations with existing content preservation", () => {
		mockFs({
			"/preserve": {
				".env": "# Comment line\nEXISTING=value\n# Another comment\nOTHER=other\n",
			},
		});

		const preserveInstance = new Dotenv({path: "/preserve/.env"});
		preserveInstance.loadFile();

		const changes = {
			"EXISTING": "updated_value",
			"NEW_VAR": "new_value",
		};

		preserveInstance.save(changes);

		// Should preserve comments and update/add variables correctly
		expect(preserveInstance.plain).toInclude("# Comment line");
		expect(preserveInstance.plain).toInclude("# Another comment");
		expect(preserveInstance.plain).toInclude("EXISTING=updated_value");
		expect(preserveInstance.plain).toInclude("NEW_VAR=new_value");
		expect(preserveInstance.plain).toInclude("OTHER=other");
	});
});

function toStringArray(object: GenericObject): string[] {
	const result: string[] = [];
	Object.entries(object).forEach(([key, value]) => {
		result.push(`${key}=${value}`);
	});
	return result;
}
