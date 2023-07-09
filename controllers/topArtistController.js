const TopArtistsService = require('../services/topArtistService');
const crypto = require('crypto');

exports.getTopArtists = async (request, response) => {
    // todo: validate parameters

    // Time loging and statictics
    const log = { time: Date.now(), id: crypto.randomBytes(4).toString('hex') }
    console.log(`New: [${log.id}] (${(Date.now() - log.time) / 1000})s Request started`);

    // tmp validation, move to function later
    if (request.params.amount) {
        if (isNaN(Number(request.params.amount))) {
            response.writeHead(400, { "Content-Type": "application/json" });
            response.end(JSON.stringify({ error: 102, message: 'invalid amount type' }));
            console.log(`End: [${log.id}] (${(Date.now() - log.time) / 1000})s Request error`);
            return;
        }
        if (Number(request.params.amount) <= 0) {
            response.writeHead(400, { "Content-Type": "application/json" });
            response.end(JSON.stringify({ error: 103, message: 'invalid amount, must be more than 0' }));
            console.log(`End: [${log.id}] (${(Date.now() - log.time) / 1000})s Request error`);
            return;
        }
    }
    if (typeof request.params.userId != 'string') {
        response.writeHead(400, { "Content-Type": "application/json" });
        response.end(JSON.stringify({ error: 104, message: 'userId must be a valid string' }));
        console.log(`End: [${log.id}] (${(Date.now() - log.time) / 1000})s Request error`);
        return;
    }
    if (request.params.userId.trim().length = 0) {
        response.writeHead(400, { "Content-Type": "application/json" });
        response.end(JSON.stringify({ error: 104, message: 'userId must be a valid string' }));
        console.log(`End: [${log.id}] (${(Date.now() - log.time) / 1000})s Request error`);
        return;
    }

    const topArtists = await TopArtistsService.getTopArtists(request.params, log);
    if (topArtists.error) {
        // rozbuduj o więcej kodów
        if (topArtists.error == 101 || topArtists.error == 6) {
            response.writeHead(200, { "Content-Type": "application/json" });
        } else {
            response.writeHead(400, { "Content-Type": "application/json" });
        }
    } else {
        response.writeHead(200, { "Content-Type": "application/json" });
    }
    response.end(JSON.stringify(topArtists));
    console.log(`End: [${log.id}] (${(Date.now() - log.time) / 1000})s Request ended`);
};

// validation, check if amount is a number and userId a string
