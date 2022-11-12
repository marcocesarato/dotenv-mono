<div align="center">

# Dotenv mono

### If this project has helped you out, please support us with a star 🌟

<br>

[![NPM version](http://img.shields.io/npm/v/dotenv-mono.svg?style=for-the-badge)](http://npmjs.org/package/dotenv-mono)
[![js-prettier-style](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=for-the-badge)](https://prettier.io/)

<!--[![Package Quality](https://npm.packagequality.com/shield/dotenv-mono.svg?style=for-the-badge)](https://packagequality.com/#?package=dotenv-mono)-->

</div>

## 📘 Description

#### What is this?

To prevent code duplication and enhance re-usability, a centralized configuration including all of your environment variables might be handy.
Rather of generating a `.env` file for each package, we may utilize a single `.env` file at the project's root.

This is a package that allows monorepo applications and packages to share and load a centralized dotenv.
It's based over [dotenv](https://github.com/motdotla/dotenv) package.

It also includes some extra features such as manipulation and saving of changes to the dotenv file.

The plugin [dotenv-expand](https://www.npmjs.com/package/dotenv-expand) is enabled by default.

##### Structure Example

```text
├── .env
├── packages
│   ├── ui-library
│   ├── other-library
├── apps
│   ├── nextjs
│   ├── docs
```

#### How it works?

The package search the first `.env` file, matching with some priority criteria, by walking up the parent directories.

##### Priorities

Starting from the current process directory, this package finds the first file that matches the best particular filename criteria with the highest priority.
The greater the depth of the up folder, the lesser its priority.

> Note: The allowed values for `NODE_ENV` are usually `test`, `development` and `production`.

| Priority | File name                |
| -------- | ------------------------ |
| 75       | `.env.$(NODE_ENV).local` |
| 50       | `.env.local`             |
| 25       | `.env.$(NODE_ENV)`       |
| 1        | `.env`                   |

###### Example

```text
├── .env            | PRIORITY = 1
├── apps            | --------------
│   ├── .env.local  | PRIORITY = 150
│   ├── nextjs      | --------------
│   │   ├── .env    | PRIORITY = 201
```

They can be customized on the constructor `priorities` property, see the example below on
the [usage](#change-priorities) section.

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

#### Standard

```js
require("dotenv-mono").load();

// or

const {dotenvLoad} = require("dotenv-mono");
dotenvLoad();

// or

import {dotenvLoad} from "dotenv-mono";
dotenvLoad();
```

#### Using the class

```js
const {Dotenv} = require("dotenv-mono");
const dotenv = new Dotenv();
dotenv.load();
```

#### Having the output

If you want to have back directly the output like [dotenv](https://github.com/motdotla/dotenv) package.

```js
require("dotenv-mono").config();
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
const dotenv = new Dotenv();
dotenv.loadFile(); // Not loading into process
dotenv.save({
	"MY_ENV_1": "enjoy",
	"MY_ENV_2": "'enjoy quotes'",
	"MY_ENV_3": 999,
});
```

## 💡 Methods

### Config

| Setting      | Description                                                                                                     | Default                       |
| ------------ | --------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| `cwd`        | Specify the current working directory                                                                           | `process.cwd()`               |
| `debug`      | Turn on/off logging to help debug why certain keys or values are not being set as you expect                    | `false`                       |
| `depth`      | Specify the max depth to reach finding up the folder from the children directory                                | `4`                           |
| `encoding`   | Specify the encoding of your file containing environment variables                                              | `utf8`                        |
| `expand`     | Turn on/off the [`dotenv-expand`](https://www.npmjs.com/package/dotenv-expand) plugin                           | `true`                        |
| `extension`  | Specify to load specific dotenv file used only on specific apps/packages (ex. `.env.server...`)                 |                               |
| `override`   | Override any environment variables that have already been set on your machine with values from your `.env` file | `false`                       |
| `path`       | Specify a custom path if your file containing environment variables is located elsewhere                        |                               |
| `priorities` | Specify the criteria of the filename priority to load as dotenv file                                            | See [Priorities](#priorities) |

### Methods

#### Load

It will read your `.env` file following the criteria, parse the contents, assign it to `process.env`.

```
public load(loadOnProcess: boolean): Dotenv;
```

#### LoadFile

It will read your `.env` file following the criteria, parse the contents, ready to be read or changed programmatically.

```
public loadFile(): Dotenv;
```

#### Save

Merge the data on input with the loaded data from `load` or `loadFile`, and save the changes on the original dotenv file.

```
public save(changes: Record<string, any>): Dotenv;
```

#### Parse

See the [dotenv](https://github.com/motdotla/dotenv) documentation [HERE](https://github.com/motdotla/dotenv#parse)

```
public parse<T extends Record<string, any> = Record<string, any>>(src: string | Buffer): T;
```

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
