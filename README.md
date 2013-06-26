node-compass
============

Compass middleware for node.js & express.

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

## Configuration

`node-compass` is highly configurable.

By default, `node-compass` expects your assets folder to be named `public`, and for
both your `*.scss` and `*.css` files to be in '/public/stylesheets/'. This can be changed
by passing an array of options to the middleware. To change the root assets folder, pass
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

#### cache

**default:** true

**description:** enable/disable caching.

#### logging

**default:** false

**description:** Enable/disables logging to terminal when attempting to compile sass files.

#### config_file

**default:** false

**description:** Use this config option to point to a valid compass `config.rb` file, if you would prefer to use that for your config instead.