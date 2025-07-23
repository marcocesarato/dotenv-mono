const js = require("@eslint/js");
const globals = require("globals");
const tsPlugin = require("@typescript-eslint/eslint-plugin");
const tsParser = require("@typescript-eslint/parser");

module.exports = [
	js.configs.recommended,
	{
		files: ["**/*.ts"],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				sourceType: "module",
				ecmaVersion: "latest",
				project: "./tsconfig.json",
			},
			globals: {
				...globals.node,
				...globals.browser,
				...globals.jest,
			},
		},
		plugins: {
			"@typescript-eslint": tsPlugin,
			jest: require("eslint-plugin-jest"),
			"jest-extended": require("eslint-plugin-jest-extended"),
			"simple-import-sort": require("eslint-plugin-simple-import-sort"),
			prettier: require("eslint-plugin-prettier"),
		},
		rules: {
			...tsPlugin.configs.recommended.rules,
			"prettier/prettier": "error",
			"no-var": "warn",
			"prefer-const": "warn",
			"no-unused-vars": "off",
			"@typescript-eslint/no-unused-vars": [
				"error",
				{
					"argsIgnorePattern": "^_",
					"varsIgnorePattern": "^_",
					"ignoreRestSiblings": true,
				},
			],
			"no-undef": "off", // TypeScript handles this
			"no-empty": ["error", {"allowEmptyCatch": true}],
		},
	},
	{
		files: ["**/*.js"],
		languageOptions: {
			globals: {
				...globals.node,
				...globals.browser,
				...globals.jest,
			},
		},
		plugins: {
			jest: require("eslint-plugin-jest"),
			"jest-extended": require("eslint-plugin-jest-extended"),
			"simple-import-sort": require("eslint-plugin-simple-import-sort"),
			prettier: require("eslint-plugin-prettier"),
		},
		rules: {
			"prettier/prettier": "error",
			"no-var": "warn",
			"prefer-const": "warn",
		},
	},
	{
		ignores: ["**/dist/**/*", "**/coverage/**/*"],
	},
];
