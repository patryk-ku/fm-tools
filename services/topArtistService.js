const apiKey = require('../credentials');

// To delete all unnecessary data from last.fm api and return only artist name and playcount
async function cleanResponse(data, amount) {
    let artists = [];
    if (amount.fetched > 1000) {
        for (let page of data) {
            for (let artist of page.topartists.artist) {
                artists[Number(artist['@attr'].rank - 1)] = {name: artist.name, playcount: artist.playcount};
            }
        }
    } else {
        for (let artist of data.topartists.artist) {
            artists[Number(artist['@attr'].rank - 1)] = {name: artist.name, playcount: artist.playcount};
        }
    }
    
    if (amount.queried) {
        artists = artists.slice(0, amount.queried);
    }
    return artists;
}

// todo: dodaj catch w fetchach

exports.getTopArtists = async (params, log) => {

    const fetchArtists = async (id, amount) => {

        if (amount.queried == -1 || amount.queried > 1000) {
            amount.perLoop = 1000;
        } else {
            amount.perLoop = amount.queried;
        }

        console.log(`[${log.id}] (${(Date.now() - log.time) / 1000})s Fetching user ${id} from last.fm API for the first time durning this request`);
        let url = `http://ws.audioscrobbler.com/2.0/?method=user.gettopartists&user=${id}&api_key=${apiKey}&limit=${amount.perLoop}&format=json`;
        const firstQuery = await fetch(url).then((res) => res.json());

        if (firstQuery.error) {
            console.log(`[${log.id}] (${(Date.now() - log.time) / 1000})s Error, fetch canceled`);
            return firstQuery;
        }
        if (!firstQuery.topartists['@attr'].totalPages) {
            return { error: 999, message: 'Unknown Error' };
        }
        if (firstQuery.topartists['@attr'].total == 0) {
                console.log(`[${log.id}] (${(Date.now() - log.time) / 1000})s Request succesful, but Error, user has not listened to any artists`);
                return {error: 101, message: 'The user has not listened to any artists'};
             }
        if (firstQuery.topartists['@attr'].totalPages == 1) {
            console.log(`[${log.id}] (${(Date.now() - log.time) / 1000})s API responded with only one page`);
            return firstQuery;
        }

        amount.fetched = 1000; //might be not exacly 1000 but it doesnt matter
        if (amount.fetched >= amount.queried && amount.queried != -1) {
            return firstQuery;
        }

        console.log(`[${log.id}] (${(Date.now() - log.time) / 1000})s Last.fm api responded, first page downloaded, pages: ${firstQuery.topartists['@attr'].totalPages}`);

        const allPages = [];
        allPages.push(firstQuery);

        // catch errors here too, mabye fetch in different function idk
        for (let i = 2; i <= firstQuery.topartists['@attr'].totalPages; i++) {
            console.log(`[${log.id}] (${(Date.now() - log.time) / 1000})s Requesting page: ${i}`);
            let url = `http://ws.audioscrobbler.com/2.0/?method=user.gettopartists&user=${id}&api_key=${apiKey}&limit=1000&page=${i}&format=json`;
            const data = fetch(url).then((res) => res.json());
            if (data.error) {
                // upgrade this to retry download one more time or smt like that
                console.log(`[${log.id}] (${(Date.now() - log.time) / 1000})s Failed to download page: ${i}`);
                break;
            }

            allPages.push(data);
            amount.fetched+= 1000;

            if (amount.fetched >= amount.queried && amount.queried != -1) {
                break;
            }

            // limit loop to 10k artists
            if (i > 10) {
                console.log(`[${log.id}] (${(Date.now() - log.time) / 1000})s Pages limit reached, maximum 11k artists`);
                break;
            }
        }

        // console.log(`[${log.id}] (${(Date.now() - log.time) / 1000})s All pages downloaded`);
        // return allPages; // add await in loop for synchronous download
        return await Promise.all(allPages); // async download
    }

    const amount = {queried: -1, fetched: 0, perLoop: 0};
    if (params.amount) {
        amount.queried = params.amount;
    }

    const artistsList = await fetchArtists(params.userId, amount);
    console.log(`[${log.id}] (${(Date.now() - log.time) / 1000})s Fetching complete`);
    if (artistsList.error) {
        return artistsList;
    }
    const cleanArtistsList = await cleanResponse(artistsList, amount);
    console.log(`[${log.id}] (${(Date.now() - log.time) / 1000})s Response parsed and cleaned, ready to go`);
    return cleanArtistsList;
};

//Todo: osobna funkcja do fetchowania całych stron niezależnie od endpointu api
