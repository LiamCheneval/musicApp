from flask import Flask, render_template, request, redirect
from data_manager import *
import json

app = Flask(__name__, static_folder='./static')


@app.route('/')
def hello_world():
    return '<a href="/browse">Browse...</a>'


@app.route('/browse')
def browser_page():
    return render_template("browse.html")


@app.route('/api/songs')
def api_songs():
    songs = get_songs()
    return json.dumps(songs)


@app.errorhandler(404)
def error404(error):
    return ('<h1>Hello ex-adventurer!</h1><p>This page does not exist, I\'m afraid...</p><a href="/">Click here to go '
            'back home</a>')


if __name__ == '__main__':
    app.run(debug=True)
