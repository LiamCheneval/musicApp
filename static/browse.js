let colorThief = new ColorThief();

// get songs from the endpoint
let audioElement = new Audio();

let sessionToken = document.cookie.split("; ")
    .find((row) => row.startsWith("token="))
    ?.split("=")[1];

let currentlyPlaying = 0;
let playQueue = [];


let controlBarElements = {};
controlBarElements.playerBar = document.getElementsByClassName("player-bar")[0];

controlBarElements.currentSongCover = document.getElementById("current-song-cover");
controlBarElements.currentSongTitle = document.getElementById("current-song-title");
controlBarElements.currentSongArtist = document.getElementById("current-song-artist");

controlBarElements.progressBar = document.getElementById("progress-bar");
controlBarElements.seekBar = document.getElementById("seek-bar");

controlBarElements.progressTimeLeft = document.getElementById("progress-time-left");
controlBarElements.progressTotalTime = document.getElementById("progress-total-time");

controlBarElements.playPauseButton = document.getElementById("play-pause-btn");
controlBarElements.skipBackButton = document.getElementById("skip-back-btn");
controlBarElements.skipForwardButton = document.getElementById("skip-forward-btn");
controlBarElements.currentPlayPauseIcons = document.querySelectorAll(".current-play-pause-icon");

controlBarElements.likeAction = document.getElementById("like-action");
controlBarElements.likeActionIcon = document.querySelector("#like-action>.ph-heart");


let cache = [];


class Artist {
    #uid;
    #name;

    constructor({uid, name}) {
        this.#uid = uid;
        this.#name = name;
    }

    getName() {
        return this.#name;
    }
}

class Album {
    #uid;
    #title;
    #artist;
    #cover;

    constructor({uid, title, artist}) {
        this.#uid = uid;
        this.#title = title;
        this.#artist = artist;
        this.#cover = `/static/album_covers/${this.#uid}.png`;
    }

    getCover() {
        return this.#cover;
    }

    getTitle() {
        return this.#title;
    }
}

class Music {
    #uid;
    #title;
    #track_n;
    #liked;

    constructor({uid, title, artist, album, track_n, liked}) {
        this.#uid = uid;
        this.#title = title;
        this.artist = artist;
        this.album = album;
        this.#track_n = track_n;
        this.#liked = liked;
    }

    like() {
        likeSong(this.#uid);
        this.#liked = true;
        document.querySelectorAll(`[aria-label="${this.#uid}"]`).forEach((elem) => {
            elem.dataset.liked = "true";
        });
    }

    dislike() {
        dislikeSong(this.#uid);
        this.#liked = false;
        document.querySelectorAll(`[aria-label="${this.#uid}"]`).forEach((elem) => {
            elem.dataset.liked = "false";
        });
    }

    isLiked(){
        return this.#liked;
    }

    getUid() {
        return this.#uid;
    }

    getFile() {
        return `/static/audio_files/${this.#uid}.mp3`;
    }

    getTitle() {
        return this.#title;
    }

    generateCardHtml() {
        return `
            <button class="song" onclick="playMusic('${this.#uid}')" aria-label="${this.#uid}" data-liked="${this.#liked}">
                <img src="${this.album.getCover()}" alt="cover">
                <div class="metadata">
                    <p class="title">${this.#title}</p>
                    <p class="artist">${this.artist.getName()}</p>
                </div>
            </button>
        `;
    }

    generateRowHtml() {
        return `
            <button class="row-song" onclick="playMusic('${this.#uid}')" aria-label="${this.#uid}" data-liked="${this.#liked}">
                <img src="${this.album.getCover()}" alt="cover">
                <div class="metadata">
                    <p class="title">${this.#title}</p>
                    <p class="artist">${this.artist.getName()}</p>
                </div>
            </button>
        `;
    }
}

class HomeScreenCategory {
    #name
    #musics = []

    constructor({name, musics}) {
        this.#name = name;
        this.#musics = musics;
    }

    setName(newName) {
        this.#name = newName;
    }

    setMusics(newMusicsArray) {
        this.#musics = newMusicsArray;
    }

    addMusic(newMusic) {
        this.#musics.push(newMusic);
    }

    getMusics() {
        return this.#musics;
    }

    getName() {
        return this.#name;
    }

    generateHtml() {
        return "";
    }
}


function populateHomeScreen() {

}

function mergeCache(newCache) {
    newCache.forEach((music) => {
        cache[music.getUid()] = music;
    });
    return cache;
}


let homeScreenSongs = [];
document.getElementById("songs").innerHTML = "<p>Loading...</p>";
axios.get(`/api/songs?token=${sessionToken}`).then((response) => {
    let musics = response.data;

    // make everything song appear in its own html element.
    document.getElementById("songs").innerHTML = "";
    let newCache = musics.map((music) => {
        let artist = new Artist(music.artist);
        let album = new Album({
            ...music.album,
            artist,
        });
        let musicObj = new Music({
            ...music,
            album,
            artist,
        });
        document.getElementById("songs").innerHTML += musicObj.generateCardHtml();
        return musicObj;
    });
    mergeCache(newCache);
    updateContextMenuEvents();
});

function loadLikedTitles() {
    document.getElementById("liked-titles").innerHTML = "<p>Loading...</p>";
    document.getElementById("liked-songs").innerHTML = "<p>Loading...</p>";
    axios.get('/api/liked_titles?token=' + sessionToken).then((response) => {
        let musics = response.data;

        // make everything song appear in its own html element.
        document.getElementById("liked-titles").innerHTML = "";
        document.getElementById("liked-songs").innerHTML = "";
        let newCache = musics.map((music) => {
            let artist = new Artist(music.artist);
            let album = new Album({
                ...music.album,
                artist,
            });
            let musicObj = new Music({
                ...music,
                album,
                artist,
            });
            document.getElementById("liked-titles").innerHTML += musicObj.generateRowHtml();
            document.getElementById("liked-songs").innerHTML += musicObj.generateCardHtml();
            return musicObj;
        });
        mergeCache(newCache);
        updateContextMenuEvents();
    });
}

loadLikedTitles();

function updateContextMenuEvents() {
    document.querySelectorAll(".row-song, .song").forEach((songElem) => {
        songElem.addEventListener("contextmenu", (e) => {
            showContextMenu(songElem.ariaLabel, e.clientX, e.clientY, songElem.dataset.liked);
            e.preventDefault();
        });
    });
}


let contextMenu = document.getElementById("context-menu");

function showContextMenu(songUid, clientX, clientY, liked) {
    contextMenu.style.display = null;
    contextMenu.style.left = clientX + "px";
    contextMenu.style.top = clientY + "px";
    contextMenu.innerHTML = `
        <button onclick="playMusic('${songUid}')"><i class="ph ph-play"></i>Play now</button>
        <button onclick="addMusicToQueue('${songUid}')"><i class="ph ph-list-plus"></i>Add to play queue</button>
    `;
    if (liked === "false") {
        contextMenu.innerHTML += `<button onclick="cache['${songUid}'].like()"><i class="ph ph-heart"></i>Like song</button>`;
    } else {
        contextMenu.innerHTML += `<button onclick="cache['${songUid}'].dislike()"><i class="ph ph-heart-break"></i>Dislike song</button>`;
    }
}

function hideContextMenu() {
    contextMenu.innerHTML = "";
    contextMenu.style.display = "none";
}


function likeSong(songUid) {
    axios.post(`/api/like_music?token=${sessionToken}&music_uid=${songUid}`).then((result) => {
        let data = result.data;
        console.log("Song liked:", songUid, "\n", data);
        loadLikedTitles();
    });
}

function dislikeSong(songUid) {
    axios.delete(`/api/dislike_music?token=${sessionToken}&music_uid=${songUid}`).then((result) => {
        let data = result.data;
        console.log("Song disliked:", songUid, "\n", data);
        loadLikedTitles();
    });
}

document.addEventListener("click", () => {
    hideContextMenu();
});


async function getMusicInfos(musicUid) {
    let musicObj;
    if (!musicUid in cache) {
        let response = await axios.get("/api/song?uid=" + musicUid);
        let music = await response.data;
        let artist = new Artist(music.artist);
        let album = new Album({
            ...music.album,
            artist,
        });
        musicObj = new Music({
            ...music,
            album,
            artist,
        });
    } else {
        musicObj = cache[musicUid];
    }
    return musicObj;
}


async function addMusicToQueue(musicUid) {
    let musicInfos = await getMusicInfos(musicUid);
    playQueue.push(musicInfos);
}

async function playInQueue(skipBack, trackNb) {
    let next = currentlyPlaying + 1;
    if (skipBack) {
        next = currentlyPlaying - 1;
    }
    if (trackNb) {
        next = trackNb;
    }
    if (next >= playQueue.length || next <= 0) {
        return;
    }

    currentlyPlaying = next;
    let currentMusic = playQueue[currentlyPlaying];

    controlBarElements.playerBar.style.display = null;

    controlBarElements.currentSongCover.style.backgroundImage = null;
    controlBarElements.currentSongTitle.innerText = "Loading...";
    controlBarElements.currentSongArtist.innerText = null;
    audioElement.src = currentMusic.getFile();
    await audioElement.load()
    await audioElement.play()
    controlBarElements.currentSongCover.style.backgroundImage = `url('${currentMusic.album.getCover()}')`;
    controlBarElements.currentSongArtist.innerText = currentMusic.artist.getName();
    controlBarElements.currentSongTitle.innerText = currentMusic.getTitle();

    if (currentMusic.isLiked()) {
        controlBarElements.likeActionIcon.classList.remove("ph");
        controlBarElements.likeActionIcon.classList.add("ph-fill");
        controlBarElements.likeAction.classList.add("liked");
    } else {
        controlBarElements.likeActionIcon.classList.remove("ph-fill");
        controlBarElements.likeActionIcon.classList.add("ph");
        controlBarElements.likeAction.classList.remove("liked");
    }

    document.getElementById("color-thief").src = currentMusic.album.getCover();
    let color = colorThief.getColor(document.getElementById("color-thief"));
    document.documentElement.style.setProperty('--accent', `rgb(${color[0]}, ${color[1]}, ${color[2]})`, 'important');

    // From MDN
    if ("mediaSession" in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: currentMusic.getTitle(),
            artist: currentMusic.artist.getName(),
            album: currentMusic.album.getTitle(),
            artwork: [
                {
                    src: currentMusic.album.getCover(),
                    sizes: "128x128",
                    type: "image/png",
                },
            ],
        });
    }
}


async function playMusic(musicUid) {
    await addMusicToQueue(musicUid);
    await playInQueue(false, playQueue.length - 1);
}


function secondsToTimeDisplay(seconds) {
    if (!seconds) {
        return "--:--"
    }
    seconds = Math.round(seconds); // It's because I don't trust myself to remember to do it everytime I call the function
    let minutes = Math.floor(seconds / 60);
    seconds = seconds % 60;

    // adding some zeros
    minutes = minutes.toString().padStart(2, "0");
    seconds = seconds.toString().padStart(2, "0");

    return `${minutes}:${seconds}`;
}


audioElement.addEventListener("timeupdate", () => {
    let progress = audioElement.currentTime / audioElement.duration * 100; // calculate percentage of music played.
    controlBarElements.progressBar.style.width = `${progress}%`;
    controlBarElements.progressTimeLeft.innerText = secondsToTimeDisplay(Math.abs(audioElement.duration - audioElement.currentTime));
    controlBarElements.progressTotalTime.innerText = secondsToTimeDisplay(audioElement.duration); // NOTE: We might not need to actually update it all the time
});

audioElement.addEventListener("ended", () => {
    playInQueue();
});

audioElement.addEventListener("loadeddata", () => {
    // use audioElement.buffered.end(0) to get the loaded part of a track
});


controlBarElements.seekBar.addEventListener("click", (event) => {
    let boundingClientRect = controlBarElements.seekBar.getBoundingClientRect();
    let relativeX = event.clientX - boundingClientRect.left;
    let percentageSeeked = relativeX / boundingClientRect.width;
    audioElement.currentTime = percentageSeeked * audioElement.duration;
});


controlBarElements.playPauseButton.addEventListener("click", () => {
    if (audioElement.paused) {
        audioElement.play();
        return
    }
    audioElement.pause();
});

controlBarElements.skipBackButton.addEventListener("click", () => {
    if (audioElement.currentTime > 3) {
        audioElement.currentTime = 0
        return
    }
    playInQueue(true);
});
controlBarElements.skipForwardButton.addEventListener("click", () => {
    playInQueue();
});


function handleAudioPlayPause() {
    // Switches icons in all play/pause button icons
    controlBarElements.currentPlayPauseIcons.forEach((currentPlayPauseIcon) => {
        if (audioElement.paused && currentPlayPauseIcon.classList.contains("ph-pause")) {
            currentPlayPauseIcon.classList.remove("ph-pause");
            currentPlayPauseIcon.classList.add("ph-play");
            return
        }
        if (currentPlayPauseIcon.classList.contains("ph-play")) {
            currentPlayPauseIcon.classList.remove("ph-play");
            currentPlayPauseIcon.classList.add("ph-pause");
        }
    });
}

audioElement.addEventListener("play", handleAudioPlayPause);
audioElement.addEventListener("pause", handleAudioPlayPause);

// From MDN
if ("mediaSession" in navigator) {
    navigator.mediaSession.setActionHandler("play", () => {
        audioElement.play()
    });
    navigator.mediaSession.setActionHandler("pause", () => {
        audioElement.pause()
    });
    navigator.mediaSession.setActionHandler("stop", () => {
        audioElement.pause()
    });
    navigator.mediaSession.setActionHandler("previoustrack", () => {
        if (audioElement.currentTime > 3) {
            audioElement.currentTime = 0
            return
        }
        playInQueue(true);
    });
    navigator.mediaSession.setActionHandler("nexttrack", () => {
        playInQueue()
    });
}
