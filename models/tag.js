const mongoose = require('mongoose');

const tagSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    slug: {
        type: String,
        required: true
    },
    term_group: {
        type: Number,
        required: true
    }
});

const Tag = mongoose.model('tag', tagSchema);
module.exports = mongoose.model('tag');