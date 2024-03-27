import pandas as pd

musics_df = pd.read_csv("data/library/musics.csv")
artists_df = pd.read_csv("data/library/artists.csv")
albums_df = pd.read_csv("data/library/albums.csv")


def get_songs() -> list:
    """
    Returns the complete list of songs from the csv file.
    It will by itself get the album info and artist info.
    :return: the list of songs
    """
    musics = musics_df.to_dict('records')
    for music in musics:
        music.update({"artist": get_artist_by_uid(music['artist_uid']).to_dict('records')[0]})
        del music['artist_uid']
        music.update({"album": get_album_by_uid(music['album_uid']).to_dict('records')[0]})
        del music['album_uid']
    return musics


def get_artist_by_uid(uid: str) -> pd.DataFrame:
    """
    Returns the artist by uid from the csv file
    :param uid: The uid of the artist
    :return: A panda Dataframe containing the artist information
    """
    return artists_df.loc[artists_df["uid"] == uid]


def get_album_by_uid(uid: str) -> pd.DataFrame:
    """
    Returns the album by uid from the csv file
    :param uid: The uid of the album
    :return: A panda Dataframe containing the album information
    """
    return albums_df.loc[albums_df["uid"] == uid]


def get_music_by_uid(uid: str) -> pd.DataFrame:
    """
    Returns the music by uid from the csv file
    :param uid: The uid of the music
    :return: A panda Dataframe containing the music information
    """
    return musics_df.loc[musics_df["uid"] == uid]
