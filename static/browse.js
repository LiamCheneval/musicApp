// get songs from the endpoint
axios.get('/api/songs').then((response) => {
    let songs = response.data;

    // make everything song appear in its own html element.
    songs.map((song) => {
        document.getElementById("songs").innerHTML += `
            <div class="song">
                <img src="/static/album_covers/${song.album.uid}.png" alt="cover">
                <p id="${song.uid}">${song.title} - ${song.artist.name}</p>
            </div>`;
    });
});
