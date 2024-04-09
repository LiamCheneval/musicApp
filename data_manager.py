import pandas as pd
from random import randint

TOKEN_LENGTH = 16

musics_df = pd.read_csv("data/library/musics.csv")
artists_df = pd.read_csv("data/library/artists.csv")
albums_df = pd.read_csv("data/library/albums.csv")
accounts_df = pd.read_csv("data/users.csv")
liked_titles_df = pd.read_csv("data/liked_titles.csv")


def load_data():
    global musics_df, artists_df, albums_df, accounts_df, liked_titles_df
    musics_df = pd.read_csv("data/library/musics.csv")
    artists_df = pd.read_csv("data/library/artists.csv")
    albums_df = pd.read_csv("data/library/albums.csv")
    accounts_df = pd.read_csv("data/users.csv")
    liked_titles_df = pd.read_csv("data/liked_titles.csv")


def save_data():
    accounts_df.to_csv("./data/users.csv", index=False)
    liked_titles_df.to_csv("./data/liked_titles.csv", index=False)


def get_songs(token: str = None) -> list:
    """
    Returns the complete list of songs from the csv file.
    It will by itself get the album info and artist info.
    :return: the list of songs
    """
    load_data()
    musics = musics_df.to_dict('records')
    for music in musics:
        update_music_meta(music, token)
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


def get_music_by_uid(uid: str, token: str = None) -> dict:
    """
    Returns the music by uid from the csv file
    :param uid: The uid of the music
    :param token: (optional) user's session token
    :return: A panda Dataframe containing the music information
    """
    load_data()
    music = musics_df.loc[musics_df["uid"] == uid].to_dict("records")[0]
    update_music_meta(music, token)
    return music


def update_music_meta(music: dict, token: str = None) -> None:
    load_data()
    music.update({"artist": get_artist_by_uid(music['artist_uid']).to_dict('records')[0]})
    del music['artist_uid']
    music.update({"album": get_album_by_uid(music['album_uid']).to_dict('records')[0]})
    del music['album_uid']
    if token:
        music.update({"liked": is_title_liked(token, music["uid"])})


# -------- USER ACCOUNT SYSTEM -------- #

def check_if_account_exists(username: str) -> bool:
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


def get_user_from_token(token: str) -> pd.DataFrame:
    load_data()
    return accounts_df.loc[accounts_df['token'] == token]


# -------- LIKED TITLES -------- #


def get_liked_titles_from_token(token: str) -> list:
    load_data()
    username = get_user_from_token(token).to_dict(orient='records')[0]["username"]
    raw_liked_titles = liked_titles_df.loc[liked_titles_df['username'] == username].to_dict('records')
    liked_titles = []
    for liked_title in raw_liked_titles:
        liked_titles.append(get_music_by_uid(liked_title["music_uid"]))
    return liked_titles


def get_liked_music_uid_from_token(token: str) -> list:
    load_data()
    username = get_user_from_token(token).to_dict(orient='records')[0]["username"]
    raw_liked_titles = liked_titles_df.loc[liked_titles_df['username'] == username].to_dict('records')
    return raw_liked_titles


def is_title_liked(token: str, target_title: str) -> bool:
    liked_music = get_liked_music_uid_from_token(token)
    titles = [t["music_uid"] for t in liked_music]
    return target_title in titles


def add_liked_title_from_token(token: str, music_uid: str) -> bool:
    global liked_titles_df
    load_data()
    if not check_token(token):
        return False
    username = get_user_from_token(token).to_dict(orient='records')[0]["username"]
    new_data = {'username': username, 'music_uid': music_uid}
    new_row = pd.DataFrame(new_data, index=[0])
    liked_titles_df = pd.concat([liked_titles_df, new_row], ignore_index=True)
    save_data()
    return True


def remove_liked_title_from_token(token: str, music_uid: str) -> bool:
    global liked_titles_df
    load_data()
    if not check_token(token):
        return False
    username = get_user_from_token(token).to_dict(orient='records')[0]["username"]
    liked_titles_df.drop(liked_titles_df.loc[liked_titles_df['music_uid'] == music_uid].loc[liked_titles_df['username'] == username].index, inplace=True)
    save_data()
    return True
