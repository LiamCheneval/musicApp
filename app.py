from flask import Flask, render_template, request, redirect, make_response, abort
from data_manager import *
import json

app = Flask(__name__, static_folder='./static')


@app.route('/')
def hello_world():
    return render_template('index.html')


@app.route('/browse')
def browser_page():
    token = request.cookies.get('token')
    is_token_valid = check_token(token)

    if not is_token_valid:
        return redirect("/")
    return render_template("browse.html")


@app.route('/api/songs')
def api_songs():
    songs = get_songs()
    return json.dumps(songs)


@app.route('/api/song')
def api_song():
    song_uid = request.values["uid"]
    if not song_uid or not do_music_exist(song_uid):
        return redirect('/404')

    song = get_music_by_uid(song_uid)
    return json.dumps(song)


@app.route('/api/login', methods=["POST"])
def handle_login_api():
    username = request.values.get('username')
    password = request.values.get('password')

    if not check_password(username, password):
        print("Invalid.")
        return redirect("/?error=invalid_login")

    token = get_new_token_for_username(username)

    response = make_response(redirect('/browse'))
    response.set_cookie('token', token, max_age=600)
    return response


@app.route('/api/me', methods=["GET"])
def handle_me_api():
    token = request.values.get('token')
    if not check_token(token):
        return abort(401, description="A valid token is required.")
    profile = get_user_from_token(token)[['username', 'token']].to_json(orient='records', lines=True)
    return profile


@app.errorhandler(404)
def error404(error):
    return ('<h1>Hello ex-adventurer!</h1><p>This page does not exist, I\'m afraid...</p><a href="/">Click here to go '
            'back home</a>')


if __name__ == '__main__':
    app.run(debug=True)
