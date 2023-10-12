from spellchecker import SpellChecker
import sys
from flask import Flask, request, jsonify
app = Flask(__name__)

spell = SpellChecker();

@app.route('/spell-check', methods = ['GET','POST'])
def index():
    sentence = request.json['sentence']
    correct_words = []
    words = sentence.split(" ")
    print(words)
    for word in words:
        correct_word = spell.correction(word)
        if(len(correct_word) > 2):
            correct_words.append(correct_word)
        else:
            continue
    
    return jsonify({
        "correct_word": correct_words
    })

if __name__ == '__main__':
    app.run('127.0.0.1', '6789')