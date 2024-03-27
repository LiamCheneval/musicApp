// get songs from the endpoint
let audioElement = new Audio();



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


function playMusic(musicUid) {
    audioElement.src = `/static/audio_files/${musicUid}.mp3`
    audioElement.load()
    audioElement.play()
}

document.getElementById("play-pause-toggle").addEventListener("click", () => {
    if (audioElement.paused){
        audioElement.play()
        return
    }
    audioElement.pause()
});
