const mongoose = require('mongoose');

const homePageSchema = new mongoose.Schema({
    isShowCategories: {
        type: Boolean,
        default: true
    },
    isShowBanner: {
        type: Boolean,
        default: true
    },
    isShowTopPicked: {
        type: Boolean,
        default: true
    },
    isShowTopCategories: {
        type: Boolean,
        default: true
    },
    current: {
        type: Boolean,
        default: true
    }
});

const HomePage = mongoose.model('homepage', homePageSchema);
module.exports = mongoose.model('homepage');