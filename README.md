node-compass
============

Compass middleware for node.js & express, built using TypeScript. Does not require TypeScript to be used.

**Node Compass 1.0 is a complete internal rewrite. All efforts have been made to keep the API the same, though bugs still may appear. Update with caution.**

## Requirements

`node-compass` requires the compass ruby gem in order to compile compass.
This can easily be installed via Terminal.
    
    $ gem update --system
    $ gem install compass

You'll want to do that as a root user.

[More Info](http://compass-style.org/install/)

## Installation

    npm install node-compass

## Usage

The easiest way to use `node-compass`, is through [express.js](http://expressjs.com).

```javascript
var compass = require('node-compass');
app.configure(function() {
	app.use(compass());
});
```

## Changelog

[**View Changelog**](Changelog.md)

## Todo

 * Automated Testing
 * Choose your own logger
 * Tutorial on pulling out and replacing certain components (middleware, compiler, etc)

## TypeScript

Node Compass is built on TypeScript, meaning you can get intellisense for the Compass API, and you can more easily explore the internals of Node Compass.

Simply import the `src/compass.ts` file within your TypeScript file in order to get started.

## Contribution

As Node Compass is built on TypeScript, you'll want to familiarise yourself with that.

It also uses [tsd](https://github.com/DefinitelyTyped/tsd) to manage definitions for 3rd party libraries.

To build node compass, make sure you've installed all tsd and npm dependencies (they won't be installed when you clone the library) and then run the following command.

```
grunt build
```

You can also have grunt build every time you update a TypeScript file using the `grunt watch` command.

Also, please make sure all pull requests are made from a separate branch to the development branch.

## Configuration

`node-compass` is highly configurable.

By default, `node-compass` expects your assets folder to be named `public`, and for
both your `*.scss` and `*.css` files to be in '/public/stylesheets/'. This can be changed
by passing an object of options to the middleware. To change the root assets folder, pass
an array with project in it.

For example, to change it to assets:

```javascript
compass({
	project: path.join(__dirname, 'assets')
});
```

### Configuration Options

#### mode

**default:** compress

**description:** The output mode you wish to use.
Can be expanded, nested, compressed or compact.

#### comments

**default:** false

**description:** Show line comments or not.

#### relative

**default:** true

**description:** Are assets relative.

#### css

**default:** stylesheets

**description:** The folder inside the project to output css into.

#### sass

**default:** stylesheets

**description:** The folder inside the project to find sass in.

#### project

**default:** public

**description:** The location where all your assets are store.

#### import_path

**default:** **project**

**description:** The location where compass should look for imports. Defaults to the value of project.

#### cache

**default:** true

**description:** enable/disable caching. When enabled, compass won't run unless node compass itself detects changes (compass can be quite slow at doing this)

#### logging

**default:** false

**description:** Enable/disables logging to terminal when attempting to compile sass files.

#### config_file

**default:** false

**description:** Use this config option to point to a valid compass `config.rb` file, if you would prefer to use that for your config instead.