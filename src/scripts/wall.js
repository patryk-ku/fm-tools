import { colorSets } from './colorSets.js';
import 'html2canvas';

const theWall = {
    nickname: document.querySelector('#nickname'),
    output: document.querySelector('#output'),
    outputArtists: document.querySelector('#artists'),
    outputNickname: document.querySelector('#output-nickname'),
    outputInfo: document.querySelector('#info'),
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
        // createIcon: document.querySelector('#create-button > div'),
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
    fetchData() {
        if (this.isRequestPending) {
            console.log('Request pending, button disabled.');
            return;
        }

        this.displayError(false);
        this.nickname.value = this.nickname.value.trim();

        if (this.nickname.value.length === 0) {
            this.displayError('Insert your last fm nickname!');
            return;
        }

        this.isRequestPending = true;
        this.buttons.create.style.visibility = 'hidden';
        this.buttons.download.style.visibility = 'hidden';
        this.output.style.display = 'none';
        this.loadingOverlay.style.display = 'block';
        localStorage.setItem('nickname', this.nickname.value);

        // Check if user data is saved in cache
        if (this.cache.hasOwnProperty(this.nickname.value)) {
            console.log('Loading user ' + this.nickname.value + ' from cache.');
            this.loadingOverlay.style.display = 'none';
            this.drawOutput(this.cache[this.nickname.value]);
            this.buttons.create.style.visibility = 'visible';
            return;
        }

        // Finally fetching user data from api
        console.log('Fetching user ' + this.nickname.value + ' from API.');
        fetch('api/thewall/' + this.nickname.value)
            .then(res => {
                if (!res.ok) {
                    throw Error(res.statusText);
                }
                return res;
            })
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    throw Error(data.message);
                }
                if (data.topartists['@attr'].total == 0) {
                    throw Error('The user has not listened to any artists');
                }
                return data;
            })
            .then(data => {
                this.loadingOverlay.style.display = 'none';
                this.cache[this.nickname.value] = data;
                this.drawOutput(data);
                this.buttons.create.style.visibility = 'visible';
            })
            .catch(error => {
                // console.warn(error);
                this.loadingOverlay.style.display = 'none';
                this.buttons.create.style.visibility = 'visible';
                this.isRequestPending = false;
                this.displayError(error);
            });
    },
    drawOutput(apiResponse) {
        this.outputArtists.innerHTML = '';
        for (let artist of apiResponse.topartists.artist) {
            let span = document.createElement('span');
            span.innerHTML = artist.name;
            span.classList.add('artist-name');
            this.outputArtists.append(span);
        }
        this.outputNickname.innerHTML = apiResponse.topartists['@attr'].user;
        this.output.style.display = 'block';
        this.buttons.download.style.visibility = 'visible';
        this.isRequestPending = false;
    },
    downloadImage() {
        this.buttons.downloadIcon.classList.remove('active');
        void this.buttons.downloadIcon.offsetWidth;
        this.buttons.downloadIcon.classList.add('active');

        html2canvas(this.output).then((canvas) => {
            let link = document.createElement('a');
            link.href = canvas.toDataURL('image/png');
            link.download = this.nickname.value + '-the-wall';
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
theWall.initialize();


// Settings objects:

// Settings for download image proportions
const imageProportions = {
    outputDiv: document.querySelector('#output'),
    active: '',
    buttons: {
        square: {
            icon: document.querySelector('#settings-square-proportions'),
            proportion: 'square'
        },
        wide: {
            icon: document.querySelector('#settings-rectangle-proportions'),
            proportion: 'wide'
        },
        thin: {
            icon: document.querySelector('#settings-rectangle2-proportions'),
            proportion: 'thin'
        }
    },
    change(button) {
        imageProportions.active.icon.classList.remove('active');
        button.icon.classList.add('active');
        imageProportions.outputDiv.className = button.proportion;
        imageProportions.active = button;
    }
};

Object.keys(imageProportions.buttons).forEach((key) => {
    imageProportions.buttons[key].icon.addEventListener('click', imageProportions.change.bind(null, imageProportions.buttons[key]));
});
imageProportions.active = imageProportions.buttons.square;


// Settings for text align
const textAlign = {
    artistsDiv: document.querySelector('#artists'),
    infoDiv: document.querySelector('#info'),
    active: '',
    buttons: {
        left: {
            icon: document.querySelector('#settings-align-text-left > div'),
            background: document.querySelector('#settings-align-text-left'),
            artists: 'left',
            info: 'left'
        },
        right: {
            icon: document.querySelector('#settings-align-text-right > div'),
            background: document.querySelector('#settings-align-text-right'),
            artists: 'right',
            info: 'right'
        },
        center: {
            icon: document.querySelector('#settings-align-text-center > div'),
            background: document.querySelector('#settings-align-text-center'),
            artists: 'center',
            info: 'center'
        },
        justify: {
            icon: document.querySelector('#settings-align-text-justify > div'),
            background: document.querySelector('#settings-align-text-justify'),
            artists: 'space-between',
            info: 'center'
        }
    },
    align(button) {
        textAlign.active.background.classList.remove('active');
        button.background.classList.add('active');
        textAlign.artistsDiv.style.justifyContent = button.artists;
        textAlign.infoDiv.style.textAlign = button.info;
        textAlign.active = button;
    }
};

// lol it works xD
Object.keys(textAlign.buttons).forEach((key) => {
    textAlign.buttons[key].icon.addEventListener('click', textAlign.align.bind(null, textAlign.buttons[key]));
});
textAlign.active = textAlign.buttons.left;

// Settings for divider
const divider = {
    active: '',
    buttons: {
        none: {
            icon: document.querySelector('#settings-divider-none > div'),
            background: document.querySelector('#settings-divider-none'),
            class: 'divider-none'
        },
        comma: {
            icon: document.querySelector('#settings-divider-comma > div'),
            background: document.querySelector('#settings-divider-comma'),
            class: 'divider-comma'
        },
        color: {
            icon: document.querySelector('#settings-divider-color > div'),
            background: document.querySelector('#settings-divider-color'),
            class: 'divider-color'
        }
    },
    change(button) {
        theWall.outputArtists.classList.remove(divider.active.class);
        theWall.outputArtists.classList.add(button.class);
        divider.active.background.classList.remove('active');
        button.background.classList.add('active');
        divider.active = button;
    }
};

// lol it works xD
Object.keys(divider.buttons).forEach((key) => {
    divider.buttons[key].icon.addEventListener('click', divider.change.bind(null, divider.buttons[key]));
});
divider.active = divider.buttons.color;
divider.change(divider.buttons.color);

// TODO & Ideas:
// option for raindbow divider with dark but not black background
// clean api response (in node return pure object with only artists)
// add different fonts
// ! html titles for every settings option
// upewnij się przy zbyt długich nazwach czy się mieszczą i word break nie spacje tylko w trakcie słowa wtedy też
// wallpaper download mode
// przepisz ustawienia na obiekt? idk
// add option for text shadow in settings
// save top 50 artists in localstorage for week/month
// może usuń cursor pointer z ikonek idk
// przemyśl ciemniejszy biały na text
// chrome auto bar theme and norif background
// efekt clickniecia na mobile bo firefox nie ma
// opcja wklejenia kodu html dla mobile xd bo firefox.. xd
// pobierz fonta google do siebie
// option to save favourite theme and auto load it on every page
// uzupełnij meta tagi na podstronach
// move common js function like color swap to separate file and import it everywhere needed
// logo button jako rozwijana lista z linkami do wszystkich narzędzi, strzałka po boku w dół czy coś
// dodaj opcje do check friend typu makx artystów itp te liczby co wpisałem chwilowo na stałe
// jest jakiś błąd w friend check i nie odświeża się jak zmienisz nick czeba strone zresetować idk
// total amount czy coś do wyświetlania jeszcze jakieś statsy tam typu procenty na friend check
