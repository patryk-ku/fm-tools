# .fm TOOLS
My collection of tools for playing with last.fm data.

Written in JavaScript and Node.js. It is not finished yet, expect bugs. In the future I plan to add more tools and make this a whole set of different utilities to play with last.fm data.

## Install and usage

First copy repository:

```
git clone "https://github.com/patryk-ku/fm-tools"
```

Then install all dependencies:

```
npm install
```

> You need last.fm API key for backend to work. You can get one [here](https://www.last.fm/api#getting-started). Then rename `credentials.js.original` to `credentials.js` and insert your key here.

To run development server:

```
npm start
```

Server will be available at `http://localhost:1234`

To build frontend files:

```
npm run build
```

Bundled files output: `/public`.

Now to start app in production mode run:

```
node app.js
```

To install only production modules:

```
npm install --omit=dev
```
