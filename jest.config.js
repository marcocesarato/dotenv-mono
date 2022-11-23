/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
	preset: "ts-jest",
	testEnvironment: "node",
	coverageDirectory: "./coverage/",
	collectCoverage: true,
	coverageReporters: ["json", "html"],
	testPathIgnorePatterns: ["dist"],
	setupFilesAfterEnv: ["jest-extended/all"],
};
