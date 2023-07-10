import { colorSets } from './colorSets.js';
import * as html2canvas from 'html2canvas';

const checkFriend = {
    nickname: document.querySelector('#nickname'),
    nicknameFriend: document.querySelector('#nickname-friend'),
    output: document.querySelector('#output'),
    outputArtists: document.querySelector('#artists'),
    settingsContainer: document.querySelector('#settings-container'),
    loadingOverlay: document.querySelector('#output-loading-overlay'),
    errorOverlay: document.querySelector('#output-error-overlay'),
    errorOverlayText: document.querySelector('#output-error-overlay-text'),
    isSettingsContainerOpen: false,
    settingsThemeList: document.querySelector('#settings-theme-list'),
    settingsPreviousActiveThemeButton: '',
    isRequestPending: false,
    domRoot: document.querySelector(':root'),
    buttons: {
        create: document.querySelector('#create-button'),
        download: document.querySelector('#download-button'),
        downloadIcon: document.querySelector('#download-button > div'),
        randomTheme: document.querySelector('#color-button'),
        randomThemeIcon: document.querySelector('#color-button > div'),
        settings: document.querySelector('#settings-icon'),
        settingsCloser: document.querySelector('#settings-popup-closer'),
        CustomTextColor: document.querySelector('#settings-custom-text'),
        CustomBackgroundColor: document.querySelector('#settings-custom-background')
    },
    cache: {},
    initialize() {
        // Hide unavailable buttons
        this.buttons.download.style.visibility = 'hidden';

        // Load user nickname if saved
        if (localStorage.hasOwnProperty('nickname')) {
            this.nickname.value = localStorage.getItem('nickname');
        }

        // Event listeners
        this.buttons.download.addEventListener('click', this.downloadImage.bind(this));
        this.buttons.randomTheme.addEventListener('click', this.randomColorTheme.bind(this));
        this.buttons.create.addEventListener('click', this.fetchData.bind(this));
        document.addEventListener("keypress", (event) => {
            if (event.key === "Enter") {
                this.fetchData();
            }
        });
        this.buttons.settings.addEventListener('click', this.openSettings.bind(this));
        this.buttons.settingsCloser.addEventListener('click', this.openSettings.bind(this));

        // Color theme settings buttons
        colorSets.forEach(theme => {
            let divIcon = document.createElement('div');
            let divIconBackground = document.createElement('div');
            divIconBackground.classList.add('settings-icon-background2');
            divIcon.classList.add('settings-theme-button');
            divIconBackground.append(divIcon);
            this.settingsThemeList.append(divIconBackground);
            divIcon.style.backgroundColor = theme[0];
            divIcon.style.color = theme[1];
            divIcon.innerHTML = 'a';
            divIcon.addEventListener('click', this.setColorTheme.bind(this, theme[0], theme[1], divIconBackground));
        });

        // Custom theme buttons
        this.buttons.CustomTextColor.addEventListener('input', (event) => {
            this.domRoot.style.setProperty('--color-secondary', event.target.value);
        });
        this.buttons.CustomBackgroundColor.addEventListener('input', (event) => {
            this.domRoot.style.setProperty('--color-background', event.target.value);
        });

        // Click random theme button to set random theme at start
        // but without last 12 themes because they are ugly
        let themeButtons = document.querySelectorAll('.settings-theme-button');
        let theme = themeButtons[Math.floor(Math.random() * (themeButtons.length - 12))];
        theme.click();
    },
    setColorTheme(backgroundColor, textColor, divIconBackground) {
        this.domRoot.style.setProperty('--color-background', backgroundColor);
        this.domRoot.style.setProperty('--color-secondary', textColor);
        this.buttons.CustomTextColor.value = textColor;
        this.buttons.CustomBackgroundColor.value = backgroundColor;
        if (this.settingsPreviousActiveThemeButton != '') {
            this.settingsPreviousActiveThemeButton.classList.remove('active');
        }
        divIconBackground.classList.add('active');
        this.settingsPreviousActiveThemeButton = divIconBackground;
    },
    randomColorTheme() {
        let themeButtons = document.querySelectorAll('.settings-theme-button');
        let theme = themeButtons[Math.floor(Math.random() * themeButtons.length)];
        theme.click();

        this.buttons.randomThemeIcon.classList.remove('active');
        void this.buttons.randomThemeIcon.offsetWidth;
        this.buttons.randomThemeIcon.classList.add('active');

    },
    async fetchData() {
        if (this.isRequestPending) {
            console.log('Request pending, button disabled.');
            return;
        }

        this.output.style.display = 'none'; //tmp

        this.displayError(false);
        this.nickname.value = this.nickname.value.trim();
        this.nicknameFriend.value = this.nicknameFriend.value.trim();

        if (this.nickname.value.length === 0) {
            this.displayError('Insert your last fm nickname!');
            return;
        }

        if (this.nicknameFriend.value.length === 0) {
            this.displayError('Insert your friend last fm nickname!');
            return;
        }

        if (this.nickname.value == this.nicknameFriend.value) {
            this.displayError('Nicknames must be different!');
            return;
        }

        this.isRequestPending = true;
        this.buttons.create.style.visibility = 'hidden';
        this.buttons.download.style.visibility = 'hidden';
        this.output.style.display = 'none';
        this.loadingOverlay.style.display = 'block';
        localStorage.setItem('nickname', this.nickname.value);

        // ----- start of new functions

        // FIXME:
        // This is very *work in proggres* but I have no time to do it better for now
        // Later I will create separate file for common functions (like all these above) and include here only new ones
        // Also I will rewrite these new funcs because it can be written better
        // Anyway it works so I will leave it for now

        // TODO:
        // - Give user option to select range of top artists. For now is hardcoded to 1000
        // - Give user option to select min playcount for artists. Fon now is hardcoded to 10
        // - Add some info about % of shared artist among all user artists etc.
        // - Improve graph if one user has significant difference in amount of plays of artists (like 10 years acc vs 1 year acc)
        // - Option to select date range
        // - Display error when users dont share any top artists

        // Asynchronous fetch of both user data
        const artistLists = await Promise.all([
            this.fetchArtists(this.nickname.value),
            this.fetchArtists(this.nicknameFriend.value)
        ]);

        //Check both user for errors and cache their data
        if (artistLists[0].error) {
            this.loadingOverlay.style.display = 'none';
            this.buttons.create.style.visibility = 'visible';
            this.isRequestPending = false;
            this.displayError(artistLists[0].message + ': ' + this.nickname.value);
            return;
        }
        this.cache[this.nickname.value] = artistLists[0];
        if (artistLists[1].error) {
            this.loadingOverlay.style.display = 'none';
            this.buttons.create.style.visibility = 'visible';
            this.isRequestPending = false;
            this.displayError(artistLists[1].message + ': ' + this.nicknameFriend.value);
            return;
        }
        this.cache[this.nicknameFriend.value] = artistLists[1];

        // Draw output from fetched data
        this.loadingOverlay.style.display = 'none';
        this.drawOutput(artistLists);
        this.buttons.create.style.visibility = 'visible';
    },
    async fetchArtists(nickname) {
        // Load data from cache if exist
        if (this.cache.hasOwnProperty(nickname)) {
            console.log('Loading user ' + nickname + ' from cache.');
            return this.cache[nickname];
        }

        // Fetch data from my api
        const data = fetch('api/topArtists/' + nickname + '/1000')
            .then(res => {
                if (!res.ok) {
                    throw Error(res.statusText);
                }
                return res;
            })
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    throw data;
                }
                return data;
            })
            .then(data => {
                return data;
            })
            .catch(error => {
                // console.warn(error);
                return error;
            });

        return await data;
    },
    drawOutput(apiResponse) {

        let yourArtists = [...apiResponse[0]];
        let friendArtists = [...apiResponse[1]];
        let sharedArtists = [];

        // Find all shared artists
        for (let i = 0; i < yourArtists.length; i++) {
            for (let j = 0; j < friendArtists.length; j++) {
                if (yourArtists[i].name == friendArtists[j].name) {
                    sharedArtists.push({
                        artist: yourArtists[i].name,
                        yourPlaycount: yourArtists[i].playcount,
                        friendPlaycount: friendArtists[j].playcount,
                        yourPosition: i,
                        friendPosition: j
                    });
                }
            }
        }

        // Sort artists in order: total playcount of both users
        let orderedSortedArtists = [];
        for (let i = 0; i < sharedArtists.length; i++) {
            let biggestThisLoop = 0;
            let biggestPositionThisLoop = 0;

            for (let j = 0; j < sharedArtists.length; j++) {
                if (sharedArtists[j].artist != 'done') {
                    if ((Number(sharedArtists[j].yourPlaycount) + Number(sharedArtists[j].friendPlaycount)) > biggestThisLoop) {
                        biggestThisLoop = Number(sharedArtists[j].yourPlaycount) + Number(sharedArtists[j].friendPlaycount);
                        biggestPositionThisLoop = j;
                    }
                }
            }

            // orderedSortedArtists.push({
            //     name: sharedArtists[biggestPositionThisLoop].artist,
            //     you: sharedArtists[biggestPositionThisLoop].yourPlaycount,
            //     friend: sharedArtists[biggestPositionThisLoop].friendPlaycount,
            //     yourPosition: sharedArtists[biggestPositionThisLoop].yourPosition,
            //     friendPosition: sharedArtists[biggestPositionThisLoop].friendPosition
            // });
            orderedSortedArtists.push({ ...sharedArtists[biggestPositionThisLoop] });
            sharedArtists[biggestPositionThisLoop].artist = 'done';
        }

        // tmp, add this to object later
        document.querySelector('#nicknameLeft').innerHTML = this.nickname.value;
        document.querySelector('#nicknameRight').innerHTML = this.nicknameFriend.value;

        // Finally draw playcount graphs
        this.outputArtists.innerHTML = '';
        let artistCounter = 0;
        orderedSortedArtists.forEach(artist => {
            // tmp set to top 10 and ignore artists with less that 10 plays from single user
            if (artistCounter > 10) {
                return;
            }
            if (Number(artist.yourPlaycount) < 10 || Number(artist.friendPlaycount) < 10) {
                return;
            }

            let div = document.createElement('div');
            let divTopBar = document.createElement('div');
            divTopBar.classList.add('top-bar');

            let divPositionLeft = document.createElement('div');
            divPositionLeft.classList.add('position');
            divPositionLeft.innerHTML = 'top #' + (Number(artist.yourPosition) + 1);
            divTopBar.append(divPositionLeft);

            let divName = document.createElement('div');
            divName.classList.add('artist-name');
            divName.innerHTML = artist.artist;
            divTopBar.append(divName);

            let divPositionRight = document.createElement('div');
            divPositionRight.classList.add('position');
            divPositionRight.innerHTML = 'top #' + (Number(artist.friendPosition) + 1);
            divTopBar.append(divPositionRight);

            div.append(divTopBar);

            let divBar = document.createElement('div');
            divBar.classList.add('bar')

            let divLeft = document.createElement('div');
            divLeft.classList.add('left');
            let divRight = document.createElement('div');
            divRight.classList.add('right');

            divLeft.innerHTML = artist.yourPlaycount;
            divRight.innerHTML = artist.friendPlaycount;

            divBar.append(divLeft);
            divBar.append(divRight);
            div.append(divBar);

            // Set width of bars
            let both = Number(artist.yourPlaycount) + Number(artist.friendPlaycount);
            let left = (Number(artist.yourPlaycount) / both) * 100;
            let right = (Number(artist.friendPlaycount) / both) * 100;
            divLeft.style.width = left + '%';
            divRight.style.width = right + '%';

            if (left > right) {
                divRight.style.backgroundColor = 'white'
            }
            if (right > left) {
                divLeft.style.backgroundColor = 'white'
            }

            this.outputArtists.append(div);
            artistCounter++;
        });

        this.loadingOverlay.style.display = 'none';
        this.isRequestPending = false;

        if (artistCounter == 0) {
            this.displayError('Users do not have any shared artists in their top 1000 (minimum 10 scrobbles)');
            return;
        }

        this.output.style.display = 'block';
        this.buttons.download.style.visibility = 'visible';

        // ----- end of new functions
    },
    downloadImage() {
        this.buttons.downloadIcon.classList.remove('active');
        void this.buttons.downloadIcon.offsetWidth;
        this.buttons.downloadIcon.classList.add('active');

        html2canvas(this.output).then((canvas) => {
            let link = document.createElement('a');
            link.href = canvas.toDataURL('image/png');
            link.download = this.nickname.value + '-' + this.nicknameFriend.value;
            link.click();
            link.remove();
        });
    },
    openSettings() {
        if (this.isSettingsContainerOpen) {
            this.buttons.settings.classList.remove('active');
            this.isSettingsContainerOpen = false;
            this.settingsContainer.style.display = 'none';
            this.buttons.settingsCloser.style.display = 'none';
        } else {
            this.buttons.settings.classList.add('active');
            this.isSettingsContainerOpen = true;
            this.settingsContainer.style.display = 'block';
            this.buttons.settingsCloser.style.display = 'block';
        }
    },
    displayError(message) {
        if (!message) {
            this.errorOverlayText.innerHTML = '';
            this.errorOverlay.style.display = 'none';
            return;
        }

        this.errorOverlayText.innerHTML = message;
        this.errorOverlay.style.display = 'block';
    }
};
checkFriend.initialize();