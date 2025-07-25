import {main as mainCli} from "./cli";
import mockFs from "mock-fs";

describe("CLI Main Function", () => {
	const originalEnv = process.env;
	const originalArgv = process.argv;
	let consoleLogSpy: jest.SpyInstance;
	let consoleErrorSpy: jest.SpyInstance;

	beforeEach(() => {
		process.env = {...originalEnv, NODE_ENV: "test"};
		consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
		consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
		jest.spyOn(process, "exit").mockImplementation(
			(code?: string | number | null | undefined) => {
				throw new Error(`Process exit called with code: ${code}`);
			},
		);

		mockFs({
			"/test": {
				".env": "TEST_VAR=test_value\nANOTHER_VAR=another_value",
				".env.custom": "CUSTOM_VAR=custom_value",
			},
		});
	});

	afterEach(() => {
		process.env = originalEnv;
		process.argv = originalArgv;
		jest.resetModules();
		mockFs.restore();
		jest.restoreAllMocks();
	});

	it("should expose mainCli function", () => {
		expect(mainCli).toBeDefined();
	});

	it("should show help when --help flag is provided", () => {
		process.argv = ["node", "cli.js", "--help"];

		expect(() => mainCli()).toThrow("Process exit called with code: 0");
		expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Usage: dotenv-mono"));
	});

	it("should handle debug mode", () => {
		process.argv = ["node", "cli.js", "--debug", "--cwd", "/test"];

		expect(() => mainCli()).toThrow("Process exit called with code: 0");
		expect(consoleLogSpy).toHaveBeenCalledWith("Configuration:", expect.any(Object));
		expect(consoleLogSpy).toHaveBeenCalledWith("Custom paths:", expect.any(Array));
		expect(consoleLogSpy).toHaveBeenCalledWith("Variables:", expect.any(Array));
	});

	it("should handle -p flag to print variable", () => {
		process.env.TEST_PRINT_VAR = "print_value";
		process.argv = ["node", "cli.js", "-p", "TEST_PRINT_VAR"];

		expect(() => mainCli()).toThrow("Process exit called with code: 0");
		expect(consoleLogSpy).toHaveBeenCalledWith("print_value");
	});

	it("should handle -p flag with non-existent variable", () => {
		process.argv = ["node", "cli.js", "-p", "NON_EXISTENT_VAR"];

		expect(() => mainCli()).toThrow("Process exit called with code: 0");
		expect(consoleLogSpy).toHaveBeenCalledWith("");
	});

	it("should handle -v flag to set variables", () => {
		process.argv = ["node", "cli.js", "-v", "TEST_SET=set_value", "--debug"];

		expect(() => mainCli()).toThrow("Process exit called with code: 0");
		expect(consoleLogSpy).toHaveBeenCalledWith("Variables:", [["TEST_SET", "set_value"]]);
	});

	it("should handle multiple -v flags", () => {
		process.argv = ["node", "cli.js", "-v", "VAR1=value1", "-v", "VAR2=value2", "--debug"];

		expect(() => mainCli()).toThrow("Process exit called with code: 0");
		expect(consoleLogSpy).toHaveBeenCalledWith("Variables:", [
			["VAR1", "value1"],
			["VAR2", "value2"],
		]);
	});

	it("should handle invalid -v flag format", () => {
		process.argv = ["node", "cli.js", "-v", "invalid_format"];

		expect(() => mainCli()).toThrow("Process exit called with code: 1");
		expect(consoleErrorSpy).toHaveBeenCalledWith(
			expect.stringContaining(
				"Invalid variable name. Expected variable in format '-v variable=value'",
			),
		);
	});

	it("should handle -e flag for custom paths", () => {
		process.argv = ["node", "cli.js", "-e", "/test/.env.custom", "--debug"];

		expect(() => mainCli()).toThrow("Process exit called with code: 0");
		expect(consoleLogSpy).toHaveBeenCalledWith("Custom paths:", ["/test/.env.custom"]);
	});

	it("should handle multiple -e flags", () => {
		process.argv = ["node", "cli.js", "-e", "/test/.env", "-e", "/test/.env.custom", "--debug"];

		expect(() => mainCli()).toThrow("Process exit called with code: 0");
		expect(consoleLogSpy).toHaveBeenCalledWith("Custom paths:", [
			"/test/.env",
			"/test/.env.custom",
		]);
	});

	it("should handle --no-expand flag", () => {
		process.argv = ["node", "cli.js", "--no-expand", "--debug"];

		expect(() => mainCli()).toThrow("Process exit called with code: 0");
		expect(consoleLogSpy).toHaveBeenCalledWith(
			"Configuration:",
			expect.objectContaining({expand: false}),
		);
	});

	it("should handle --priorities JSON", () => {
		process.argv = ["node", "cli.js", "--priorities", '{"custom": 100}', "--debug"];

		expect(() => mainCli()).toThrow("Process exit called with code: 0");
		expect(consoleLogSpy).toHaveBeenCalledWith(
			"Configuration:",
			expect.objectContaining({
				priorities: {custom: 100},
			}),
		);
	});

	it("should handle invalid --priorities JSON", () => {
		process.argv = ["node", "cli.js", "--priorities", "{invalid json}"];

		expect(() => mainCli()).toThrow("Process exit called with code: 1");
		expect(consoleErrorSpy).toHaveBeenCalledWith("Invalid priorities JSON:", expect.any(Error));
	});

	it("should exit with help when no command is provided", () => {
		process.argv = ["node", "cli.js"];

		expect(() => mainCli()).toThrow("Process exit called with code: 1");
		expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Usage: dotenv-mono"));
	});
});
