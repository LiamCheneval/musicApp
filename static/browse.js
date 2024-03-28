// get songs from the endpoint
let audioElement = new Audio();

let currentlyPlaying = 0
let playQueue = []


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


axios.get('/api/songs').then((response) => {
    let musics = response.data;

    // make everything song appear in its own html element.
    musics.map((music) => {
        document.getElementById("songs").innerHTML += `
            <div class="song" onclick="playMusic('${music.uid}')" aria-label="${music.uid}">
                <img src="/static/album_covers/${music.album.uid}.png" alt="cover">
                <div class="metadata">
                    <p class="title">${music.title}</p>
                    <p class="artist">${music.artist.name}</p>
                </div>
            </div>`;
    });

    document.querySelectorAll(".song").forEach((songElem) => {
        songElem.addEventListener("contextmenu", (e) => {
            showContextMenu(songElem.ariaLabel, e.clientX, e.clientY);
            e.preventDefault();
        });
    });
});


let contextMenu = document.getElementById("context-menu");
function showContextMenu(songUid, clientX, clientY){
    contextMenu.style.display = null;
    contextMenu.style.left = clientX + "px";
    contextMenu.style.top = clientY + "px";
    contextMenu.innerHTML = `
        <button onclick="playMusic('${songUid}')">Play now</button>
        <button onclick="addMusicToQueue('${songUid}')">Add to play queue</button>
    `;
}
function hideContextMenu() {
    contextMenu.innerHTML = "";
    contextMenu.style.display = "none";
}

document.addEventListener("click", ()=>{
    hideContextMenu();
});


async function getMusicInfos(musicUid) {
    let response = await axios.get("/api/song?uid=" + musicUid);
    return await response.data;
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
    audioElement.src = `/static/audio_files/${currentMusic.uid}.mp3`;
    await audioElement.load()
    await audioElement.play()
    controlBarElements.currentSongCover.style.backgroundImage = `url('/static/album_covers/${currentMusic.album.uid}.png')`;
    controlBarElements.currentSongArtist.innerText = currentMusic.artist.name;
    controlBarElements.currentSongTitle.innerText = currentMusic.title;

    if ("mediaSession" in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: currentMusic.title,
            artist: currentMusic.artist.name,
            album: currentMusic.album.title,
            artwork: [
                {
                    src: `/static/album_covers/${currentMusic.album.uid}.png`,
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
controlBarElements.skipForwardButton.addEventListener("click", ()=>{
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
        /* Code excerpted. */
    });
    navigator.mediaSession.setActionHandler("nexttrack", () => {
        /* Code excerpted. */
    });
}
