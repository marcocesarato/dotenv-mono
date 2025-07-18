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

It also includes some extra features such as manipulation and saving of changes to the dotenv file, a default centralized file, and a file loader with ordering and priorities.

The plugin [dotenv-expand](https://www.npmjs.com/package/dotenv-expand) is enabled by default.

##### Structure Example

```text
├── .env
├── .env.production
├── .env.defaults
├── packages
│   ├── ui-library
│   ├── other-library
├── apps
│   ├── web
│   │   ├── .storybook
│   ├── docs
```

#### How it works?

The package search the first `.env` file, matching with some priority criteria, by walking up the parent directories.

##### Priorities

Starting from the current process directory, this package finds the first file that matches the best filepath and filename criteria with the highest priority.
The greater the depth of the up folder, the lesser its priority.

The priority can be customized on the configuration with the `priorities` property, see the example below on
the [usage](#change-priorities) section.

> Note: The allowed values for `NODE_ENV` are usually `test`, `development` and `production`.

| Priority | Filename                 |
| -------- | ------------------------ |
| 75       | `.env.$(NODE_ENV).local` |
| 50       | `.env.local`             |
| 25       | `.env.$(NODE_ENV)`       |
| 1        | `.env`                   |

###### Example

Given the following folder structure with dotenv files:

```text
├── .env
├── .env.production
├── apps
│   ├── .env.development
│   ├── web
│   ├── docs
│   │   ├── .env
│   │   ├── .env.local
```

Having the following priority order:

| Path                    | Priority | Depth |
| ----------------------- | -------- | ----- |
| `.env`                  | 1        | 2     |
| `.env.production`       | 25       | 2     |
| `apps/.env.development` | 25       | 1     |
| `apps/docs/.env`        | 1        | 0     |
| `apps/docs/.env.local`  | 50       | 0     |

Then we will have the following outcome scenarios:

| Current working directory | Env           | Match                   |
| ------------------------- | ------------- | ----------------------- |
| `/`                       | `development` | `.env`                  |
| `/`                       | `production`  | `.env.production`       |
| `apps/web`                | `development` | `.env`                  |
| `apps/web`                | `development` | `apps/.env.development` |
| `apps/docs`               | `development` | `apps/docs/.env.local`  |

## 📖 Install

Install the library from npm or yarn just running one of the following command lines:

| npm                              | yarn                   |
| -------------------------------- | ---------------------- |
| `npm install dotenv-mono --save` | `yarn add dotenv-mono` |

### Install on Next.js

For custom advanced configuration of Next.js, you can create a `next.config.js` or `next.config.mjs` file in the root of
your project directory (next to `package.json`).

Add the following line at the top of the file:

```js
require("dotenv-mono").load();
```

###### Example

```js
require("dotenv-mono").load();

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
	/* config options here */
};

module.exports = nextConfig;
```

### Install on Storybook

The main configuration file is `.storybook/main.js`. This file controls the Storybook server's behavior, so you must restart Storybook’s process when you change it.

Add the following lines on the file:

```js
const dotenv = require("dotenv-mono").load();

const config = {
	/* config options here */
	env: (config) => {
		return {
			...config,
			...dotenv.env,
		};
	},
};

module.exports = config;
```

## 💻 Usage

### Load

Simple methods to export environment variables from the dotenv into the working process.
Here are several potential implementation approaches based on your preferences.

```js
// Inline
require("dotenv-mono").load(/* config */);

// Using the function
const {dotenvLoad} = require("dotenv-mono");
dotenvLoad(/* config */);

// Using import
import {dotenvLoad} from "dotenv-mono";
const dotenv = dotenvLoad(); // Dotenv instance

// Using the class
const {Dotenv} = require("dotenv-mono");
const dotenv = new Dotenv(/* config */);
dotenv.load();
```

#### Having the dotenv output

If you need a fast way to replace [dotenv](https://github.com/motdotla/dotenv) package with **dotenv-mono**, and you need also to have a retro-compatible feature, you can have back directly the output like [dotenv](https://github.com/motdotla/dotenv) package using the `config` method.

```js
// Inline
const output = require("dotenv-mono").config(/* config */);

// Using the function
const {dotenvConfig} = require("dotenv-mono");
const output = dotenvConfig(/* config */);
```

### Load file with extension

```js
// Use `.dotenv.server` or `.dotenv.server.local`, etc...
load({extension: "server"});
```

### Load specific file

```js
// You can specify the file path
load({path: "../../configs/.env"});
```

### Load without [`dotenv-expand`](https://www.npmjs.com/package/dotenv-expand) extension

```js
load({expand: false});
```

### Change default filename

```js
load({defaults: ".env.def"});
```

### Change priorities

```js
// If `.dotenv.overwrite` is present use it with max priority
load({
	priorities: {
		".env.overwrite": 100,
	},
});
```

### Make changes

```js
const dotenv = require("dotenv-mono").load();
dotenv.save({"MY_ENV_1": "enjoy"});

// Without loading into the working process
const {Dotenv} = require("dotenv-mono");
const dotenv = new Dotenv();
dotenv.loadFile(); // Skip loading into the process
dotenv.save({
	"MY_ENV_1": "enjoy",
	"MY_ENV_2": "'enjoy quotes'",
	"MY_ENV_3": 999,
});
```

### Preload

As on the [dotenv](https://github.com/motdotla/dotenv) package on the CLI/Console, you can use the `--require` (`-r`) [command line option](https://nodejs.org/api/cli.html#-r---require-module) to preload dotenv. By doing this, you do not need to require and load dotenv in your application code.

```bash
$ node -r dotenv-mono/load your_script.js
```

The configuration options below are supported as command line arguments in the format `dotenv_config_<option>=value`

```bash
$ node -r dotenv-mono/load your_script.js dotenv_config_path=/custom/path/to/.env dotenv_config_debug=true
```

Additionally, you can use environment variables to set configuration options. Command line arguments will precede these.

```bash
$ DOTENV_CONFIG_<OPTION>=value node -r dotenv-mono/load your_script.js
```

```bash
$ DOTENV_CONFIG_ENCODING=latin1 DOTENV_CONFIG_DEBUG=true node -r dotenv-mono/load your_script.js dotenv_config_path=/custom/path/to/.env
```

### CLI

You can use `dotenv-mono` as a command-line tool to run commands with environment variables loaded from your `.env` files. This is similar to `dotenv-cli` but with all the enhanced features of `dotenv-mono`.

```bash
# Basic usage - load .env and run a command
dotenv-mono -- node your_script.js

# Load specific .env file
dotenv-mono -e .env.production -- node your_script.js

# Load multiple .env files
dotenv-mono -e .env.local -e .env.production -- node your_script.js

# Set additional variables
dotenv-mono -v NODE_ENV=production -v DEBUG=true -- node your_script.js

# Print a variable value
dotenv-mono -p NODE_ENV

# Debug mode - see what files would be loaded
dotenv-mono --debug -e .env.production

# Use all dotenv-mono features
dotenv-mono --cwd /path/to/project --extension server --depth 3 -- node server.js
```

#### CLI Options

| Option                | Description                                                                                      |
| --------------------- | ------------------------------------------------------------------------------------------------ |
| `--help`              | Print help message                                                                               |
| `--debug`             | Output the files that would be processed but don't actually parse them or run the command        |
| `-e <path>`           | Parse the file `<path>` as a `.env` file and add variables to the environment (multiple allowed) |
| `-v <name>=<value>`   | Put variable `<name>` into environment using `<value>` (multiple allowed)                        |
| `-p <variable>`       | Print value of `<variable>` to the console                                                       |
| `--no-expand`         | Skip variable expansion                                                                          |
| `--override`          | Override system variables                                                                        |
| `--cwd <path>`        | Specify the current working directory                                                            |
| `--depth <number>`    | Specify the max depth to reach when finding up the folder tree                                   |
| `--encoding <enc>`    | Specify the encoding of your file containing environment variables                               |
| `--extension <ext>`   | Specify to load specific dotenv file used only on specific apps/packages                         |
| `--defaults <file>`   | Specify the defaults dotenv filename                                                             |
| `--priorities <json>` | Specify the criteria of the filename priority to load as dotenv file                             |

## 💡 Methods

### Config

| Setting      | Description                                                                                                     | Default                       |
| ------------ | --------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| `cwd`        | Specify the current working directory                                                                           | `process.cwd()`               |
| `debug`      | Turn on/off logging to help debug why certain keys or values are not being set as you expect                    | `false`                       |
| `defaults`   | Specify the defaults dotenv filename (it **can't** override any environment variables)                          | `.env.defaults`               |
| `depth`      | Specify the max depth to reach finding up the folder from the children directory                                | `4`                           |
| `encoding`   | Specify the encoding of your file containing environment variables                                              | `utf8`                        |
| `expand`     | Turn on/off the [`dotenv-expand`](https://www.npmjs.com/package/dotenv-expand) plugin                           | `true`                        |
| `extension`  | Specify to load specific dotenv file used only on specific apps/packages (ex. `.env.server...`)                 |                               |
| `override`   | Override any environment variables that have already been set on your machine with values from your `.env` file | `false`                       |
| `path`       | Specify a custom path if your file containing environment variables is located elsewhere                        |                               |
| `priorities` | Specify the criteria of the filename priority to load as dotenv file                                            | See [Priorities](#priorities) |

### Dotenv Methods

#### Load Environments

It will read your `.env` file following the criteria, parse the contents, assign it to `process.env`.

> Note: This method differs from the previous `load` **function**.
> In that it requires the configuration to be loaded on the class instance via the constructor.

```
public load(loadOnProcess: boolean): Dotenv;
```

#### Load File

It will read your `.env` file following the criteria, parse the contents, ready to be read or changed programmatically.

```
public loadFile(): Dotenv;
```

#### Save

Merge the data on input with the loaded data from `load` or `loadFile`, and save the changes on the original dotenv file.

> Note: If `.env.defaults` is present, it won't be overwritten, you can just save the changes on the main dotenv file (`.env`, `.env.local`, etc...)

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
