module.exports = {
	extends: ["prettier", "plugin:prettier/recommended"],
	plugins: ["simple-import-sort", "prettier"],
	env: {
		node: true,
		browser: true,
		jest: true,
	},
	parserOptions: {
		ecmaVersion: "latest",
	},
	rules: {
		"prettier/prettier": "error",
		"no-var": "warn",
		"prefer-const": "warn",
	},
};
