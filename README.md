<div align="center">

# Dotenv mono

### If this project has helped you out, please support us with a star 🌟

<br>

[![NPM version](http://img.shields.io/npm/v/dotenv-mono.svg?style=for-the-badge)](http://npmjs.org/package/dotenv-mono)
[![js-prittier-style](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=for-the-badge)](https://prettier.io/)

<!--[![Package Quality](https://npm.packagequality.com/shield/dotenv-mono.svg?style=for-the-badge)](https://packagequality.com/#?package=dotenv-mono)-->

</div>

## 📘 Description

#### What is this?

This is a package that permit to load a dotenv even from a children applications or packages of a monorepo.

It contains also some additionals features like manipulations and save of the changes on the dotenv file.
The package [`dotenv-expand`](https://www.npmjs.com/package/dotenv-expand) is enabled by default.

##### Example

```text
├── .env
├── packages
│   ├── my-package
│   │   ├── index.js
│   ├── my-package-2
│   │   ├── index.js
├── app
│   ├── nextjs
│   │   ├── next.config.js
│   ├── angular
│   │   ├── src
│   │   |   ├── environment.ts
```

#### How it works?

##### Priorities

This package find up, starting from the current process directory, the first file, that match the best specific
filename criteria with the higher priority. The depth of the folder, starting from the current process directory,
overwrite the files upper, having a higher priority.

| Priority | File name                                |
| -------- | ---------------------------------------- |
| 75       | .env.{development,production,test}.local |
| 50       | .env.local                               |
| 25       | .env.{development,production,test}       |
| 1        | .env                                     |

###### Example

```text
├── .env                    | PRIORITY = 1
├── app                     | --------------
│   ├── .env.local          | PRIORITY = 150
│   ├── nextjs              | --------------
│   │   ├── .env            | PRIORITY = 201
```

They can be customized on the constructor `priorities` property, see the example below on the [usage](#change-priorities) section.

## 📖 Install

Install the library from npm or yarn just running one of the following command lines:

| npm                              | yarn                   |
| -------------------------------- | ---------------------- |
| `npm install dotenv-mono --save` | `yarn add dotenv-mono` |

### Install on Next.js

For custom advanced configuration of Next.js, you can create a `next.config.js` or `next.config.mjs` file in the root of
your project directory (next to `package.json`).

Add these lines at the top of the file:

```js
// Load dotenv-mono
const {dotenvLoad} = require("dotenv-mono");
dotenvLoad();

/* other */

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
	/* config options here */
};

module.exports = nextConfig;
```

## 💻 Usage

### Load

```js
const {dotenvLoad} = require("dotenv-mono");
const dotenv = dotenvLoad();

// Same as

const {DotEnv} = require("dotenv-mono");
const dotenv = new DotEnv();
dotenv.load();
```

### Load file with extension

```js
// Use .dotenv.server or .dotenv.server.local, etc...
dotenvLoad({extension: "server"});
```

### Load specific file

```js
// You can specify the file path
dotenvLoad({path: "../../configs/.env"});
```

### Load without [`dotenv-expand`](https://www.npmjs.com/package/dotenv-expand) extension

```js
dotenvLoad({expand: false});
```

### Change priorities

```js
// If .dotenv.overwrite is present use it with max priority
dotenvLoad({
	priorities: {
		".env.overwrite": 100,
	},
});
```

### Make changes

```js
const dotenv = new DotEnv();
dotenv.loadFile(); // Not loading into process
dotenv.save({
	"MY_ENV_1": "enjoy",
	"MY_ENV_2": "'enjoy quotes'",
	"MY_ENV_3": 999,
});
```

## 💡 Methods

> Work in progress...

### Config

| Setting      | Description                                                                                  | Default                       |
| ------------ | -------------------------------------------------------------------------------------------- | ----------------------------- |
| `expand`     | Enable or disable [`dotenv-expand`](https://www.npmjs.com/package/dotenv-expand) plugin      | `true`                        |
| `priorities` | Set the criteria of the filename priority to load as dotenv file                             | See [Priorities](#priorities) |
| `depth`      | Set max depth of folder to search up from the children directory                             | `4`                           |
| `cwd`        | Set the current working directory                                                            |                               |
| `path`       | Set the file to load                                                                         |                               |
| `extension`  | Used to load specific dotenv file used only on specific apps/packages (ex. `.env.server...`) |                               |

## 🤔 How to contribute

Have an idea? Found a bug? Please raise to [ISSUES](https://github.com/marcocesarato/dotenv-mono/issues)
or [PULL REQUEST](https://github.com/marcocesarato/dotenv-mono/pulls).
Contributions are welcome and are greatly appreciated! Every little bit helps, and credit will always be given.

<p align="center">
    <br>
    <a href="https://nodei.co/npm/dotenv-mono/" rel="nofollow">
        <img align="center" src="https://nodei.co/npm/dotenv-mono.png?downloads=true&downloadRank=true" width="384">
    </a>
</p>
