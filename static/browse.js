// get songs from the endpoint
let audioElement = new Audio();

let controlBarElements = {};
controlBarElements.playerBar = document.getElementsByClassName("player-bar")[0];
controlBarElements.currentSongCover = document.getElementById("current-song-cover");
controlBarElements.currentSongTitle = document.getElementById("current-song-title");
controlBarElements.currentSongArtist = document.getElementById("current-song-artist");

axios.get('/api/songs').then((response) => {
    let musics = response.data;

    // make everything song appear in its own html element.
    musics.map((music) => {
        document.getElementById("songs").innerHTML += `
            <div class="song" onclick="playMusic('${music.uid}')">
                <img src="/static/album_covers/${music.album.uid}.png" alt="cover">
                <p id="${music.uid}">${music.title} - ${music.artist.name}</p>
            </div>`;
    });
});


async function getMusicInfos(musicUid){
    let response = await axios.get("/api/song?uid=" + musicUid);
    return await response.data;
}


async function playMusic(musicUid) {
    let musicInfos = await getMusicInfos(musicUid);
    controlBarElements.currentSongCover.src = `/static/album_covers/${musicInfos.album.uid}.png`;
    controlBarElements.currentSongArtist.innerText = musicInfos.artist.name;
    controlBarElements.currentSongTitle.innerText = musicInfos.title;
    console.log(controlBarElements.playerBar)
    controlBarElements.playerBar.style.display = null

    audioElement.src = `/static/audio_files/${musicUid}.mp3`
    await audioElement.load()
    await audioElement.play()
}

document.getElementById("play-pause-toggle").addEventListener("click", () => {
    if (audioElement.paused){
        audioElement.play()
        return
    }
    audioElement.pause()
});
