import pandas as pd
from random import randint

TOKEN_LENGTH = 16

musics_df = pd.read_csv("data/library/musics.csv")
artists_df = pd.read_csv("data/library/artists.csv")
albums_df = pd.read_csv("data/library/albums.csv")
accounts_df = pd.read_csv("data/users.csv")


def load_data():
    global musics_df, artists_df, albums_df, accounts_df
    musics_df = pd.read_csv("data/library/musics.csv")
    artists_df = pd.read_csv("data/library/artists.csv")
    albums_df = pd.read_csv("data/library/albums.csv")
    accounts_df = pd.read_csv("data/users.csv")


def get_songs() -> list:
    """
    Returns the complete list of songs from the csv file.
    It will by itself get the album info and artist info.
    :return: the list of songs
    """
    load_data()
    musics = musics_df.to_dict('records')
    for music in musics:
        update_music_meta(music)
    return musics


def do_music_exist(song_uid: str) -> bool:
    load_data()
    music = musics_df.loc[musics_df['uid'] == song_uid]
    return music is not None


def get_artist_by_uid(uid: str) -> pd.DataFrame:
    """
    Returns the artist by uid from the csv file
    :param uid: The uid of the artist
    :return: A panda Dataframe containing the artist information
    """
    load_data()
    return artists_df.loc[artists_df["uid"] == uid]


def get_album_by_uid(uid: str) -> pd.DataFrame:
    """
    Returns the album by uid from the csv file
    :param uid: The uid of the album
    :return: A panda Dataframe containing the album information
    """
    load_data()
    return albums_df.loc[albums_df["uid"] == uid]


def get_music_by_uid(uid: str) -> dict:
    """
    Returns the music by uid from the csv file
    :param uid: The uid of the music
    :return: A panda Dataframe containing the music information
    """
    load_data()
    music = musics_df.loc[musics_df["uid"] == uid].to_dict("records")[0]
    update_music_meta(music)
    return music


def update_music_meta(music: dict) -> None:
    load_data()
    music.update({"artist": get_artist_by_uid(music['artist_uid']).to_dict('records')[0]})
    del music['artist_uid']
    music.update({"album": get_album_by_uid(music['album_uid']).to_dict('records')[0]})
    del music['album_uid']


# -------- USER ACCOUNT SYSTEM -------- #

def check_if_account_exists(username: str):
    load_data()
    return username in accounts_df["username"].values


def check_password(username: str, password: str):
    load_data()
    if not check_if_account_exists(username):
        return False

    account = accounts_df.loc[accounts_df['username'] == username]
    stored_password = account['password'].values[0]
    return str(password) == str(stored_password)


def generate_random_string(length: int):
    load_data()
    alphabet = "abcdefghijklmnopqrstuvwxyz0123456789"
    string = ""
    for i in range(length):
        char = alphabet[randint(0, len(alphabet) - 1)]
        string += char
    return string


def get_new_token_for_username(username: str):
    load_data()
    if not check_if_account_exists(username):
        return False
    token = generate_random_string(TOKEN_LENGTH)
    accounts_df.loc[accounts_df['username'] == username, 'token'] = token
    save_data()
    return token


def check_token(token: str):
    load_data()
    if token not in accounts_df['token'].values:
        return False
    return True


def get_user_from_token(token: str):
    load_data()
    return accounts_df.loc[accounts_df['token'] == token]


def save_data():
    accounts_df.to_csv("./data/users.csv", index=False)

