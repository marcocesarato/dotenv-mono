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

This is a library that permit to load a dotenv even from a children package of a monorepo.

It contains also some additionals features like manipulations and save of the changes on the dotenv file.
The package [`dotenv-expand`](https://www.npmjs.com/package/dotenv-expand) is enabled by default.

#### Priorities

This package find up, starting from the current process directory, the first file name that match the specific criterias.

| Priority | File name                                |
| -------- | ---------------------------------------- |
| 75       | .env.{development,production,test}.local |
| 50       | .env.local                               |
| 25       | .env.{development,production,test}       |
| 0        | .env                                     |

They can be customized on the constructor `priorities` property, see the example below.

## 📖 Install

Install the library from npm or yarn just running one of the following command lines:

| npm                              | yarn                   |
| -------------------------------- | ---------------------- |
| `npm install dotenv-mono --save` | `yarn add dotenv-mono` |

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

## 🤔 How to contribute

Have an idea? Found a bug? Please raise to [ISSUES](https://github.com/marcocesarato/dotenv-mono/issues) or [PULL REQUEST](https://github.com/marcocesarato/dotenv-mono/pulls).
Contributions are welcome and are greatly appreciated! Every little bit helps, and credit will always be given.

<p align="center">
    <br>
    <a href="https://nodei.co/npm/dotenv-mono/" rel="nofollow">
        <img align="center" src="https://nodei.co/npm/dotenv-mono.png?downloads=true&downloadRank=true" width="384">
    </a>
</p>
