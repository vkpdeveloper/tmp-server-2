const express = require("express");
const stopwords = require('nltk-stopwords');
const AlgoliaController = require("../controllers/algolia");
const { plural } = require("../controllers/string");
const pos = require('pos');

const router = express.Router();
const algolia = new AlgoliaController()

let db;

const english = stopwords.load('english')
const units = [
    "gram",
    "gm",
    "kilogram",
    "kg",
    "liter",
    "lt",
    "milliliter",
    "ml",
    "pc",
    "piece",
    "pcs",
    "g",
    "k",
    "l",
    "ltr",
    "mltr",
]

router.get("/history", async (req, res) => {
    try {
        const { uid } = req.query;
        const [rows, fields] = await db.execute("SELECT * FROM search_history WHERE uid = ? LIMIT 5", [uid]);
        res.json(rows);
    } catch (e) {
        res.status(500).json({
            message: "Something went wrong",
            error: e.message
        });
    }
})

router.post("/history", (req, res) => {
    const { searchTerm, tagId, subcategoryId } = req.body;
    const { uid } = req.query;
    if (!uid || !searchTerm) {
        res.status(400).json({
            message: "Missing parameters"
        });
        return;
    } else {
        if (!tagId) {
            db.execute("INSERT INTO search_history (uid, search_term) VALUES (?, ?)", [uid, searchTerm])
                .then(result => {
                    res.json({
                        message: "Search history added successfully"
                    });
                })
                .catch(err => {
                    res.status(500).json({
                        message: "Something went wrong",
                        error: err.message
                    });
                });
        } else {
            db.execute("INSERT INTO search_history (uid, search_term, tag_id, subcategory_id) VALUES (?, ?, ?, ?)", [uid, searchTerm, tagId, subcategoryId])
                .then(result => {
                    res.json({
                        message: "Search history added successfully"
                    });
                })
                .catch(err => {
                    res.status(500).json({
                        message: "Something went wrong",
                        error: err.message
                    });
                });
        }
    }
})

router.put("/history/click", async (req, res) => {
    try {
        const { id } = req.query;
        let result = await db.execute("UPDATE search_history SET clicks = clicks + 1 WHERE id = ?", [id])
        res.json({
            message: "Search history updated successfully"
        });
    } catch (e) {
        res.status(500).json({
            message: "Something went wrong",
            error: e.message
        });
    }
})

router.get("/filter/stopwords", async (req, res) => {
    try {
        const { q: query } = req.query;
        let result = stopwords.remove(query, english)
        // remove symbols from the query
        result = result.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '');
        result = result.replace(/\s+/g, ' ').trim();

        const words = result.split(" ");
        const singularWords = words.map(word => plural(word, true));
        const singularWordsJoined = singularWords.join(" ")
        const lexedWords = new pos.Lexer().lex(singularWordsJoined);
        const tagger = new pos.Tagger();
        const taggedWords = tagger.tag(lexedWords);
        const nouns = taggedWords.filter(word => word[1] === "NN" || word[1] === "NNS" || word[1] === "NNP" || word[1] === "NNPS");
        const unitsCD = taggedWords.filter(word => units.includes(word[0]) || word[1] === "CD");

        // filter units from nouns
        const filteredNouns = nouns.filter(word => !units.includes(word[0].toLowerCase()));

        res.send({
            success: true,
            result: result,
            singular: singularWords,
            singularResult: singularWordsJoined,
            nouns: filteredNouns,
            units: unitsCD
        })
    } catch (e) {
        res.status(500).json({
            message: "Something went wrong",
            error: e.message
        });
    }
})

module.exports = (connection) => {
    db = connection;
    return router;
};