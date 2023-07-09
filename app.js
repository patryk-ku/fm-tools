// Uncomment this if your hosting using node ver < 18
// const fetch = require('node-fetch');
// And do: 'npm install node-fetch@2' to be able to use fetch
const express = require('express');
const path = require('path');
const app = express();
const port = 3000;
const apiKey = require('./credentials.js');
const topArtistsRouter = require('./routes/topArtists');

// Also if your hosting have special folder for hosting static files you can comment this line:
app.use(express.static('public'));

app.get("/api/thewall/:nickname/", function (request, response) {
    let nickname = request.params.nickname;
    fetch(' http://ws.audioscrobbler.com/2.0/?method=user.gettopartists&user=' + nickname + '&api_key=' + apiKey + '&format=json')
        .then((res) => res.json())
        .then((data) => {
            response.writeHead(200, { "Content-Type": "application/json" });
            response.end(JSON.stringify(data));
        });
});

//Api routes
app.use('/api/topArtists', topArtistsRouter);

// Api 404 error response
app.all('/api/*', (req, res) => {
    res.status(404).json({"error": "404 page not found"});
});

// Custom 404 error page
app.all('*', (req, res) => {
    res.status(404);
    if (req.accepts('html')) {
        res.sendFile(path.join(__dirname, 'public', 'error.html'));
    } else if (req.accepts('json')) {
        res.json({"error": "404 page not found"});
    } else {
        res.type('txt').send('404 page not found');
    }
});

app.listen(port, () => {
    console.log(`Server started on: ${port}.`)
});
