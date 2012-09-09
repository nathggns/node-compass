node-compass
============

Compass middleware for node.js.

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

For further configuation options, please browse the source.