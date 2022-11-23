module.exports = {
	root: true,
	parser: "@typescript-eslint/parser",
	extends: ["prettier", "plugin:prettier/recommended"],
	plugins: ["@typescript-eslint", "jest", "jest-extended", "simple-import-sort", "prettier"],
	env: {
		node: true,
		browser: true,
		jest: true,
	},
	parserOptions: {
		sourceType: "module",
		ecmaVersion: "latest",
	},
	rules: {
		"prettier/prettier": "error",
		"no-var": "warn",
		"prefer-const": "warn",
	},
	ignorePatterns: ["**/dist/**/*", "**/coverage/**/*"],
};
