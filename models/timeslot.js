const mongoose = require('mongoose');

const timeslotSchema = new mongoose.Schema({
    startTime: {
        required: true,
        type: Number
    },
    timeDifference: {
        required: true,
        type: Number
    },
    slotDifference: {
        required: true,
        type: Number
    },
    tomorrowSlotStartTime: {
        required: true,
        type: Number
    },
    timeOfTomorrowSlotToShow: {
        required: true,
        type: Number
    },
    timeOfTodaySlotToShow: {
        required: true,
        type: Number
    },
    changeableTime: {
        required: true,
        type: Number,
    },
    timeslotLoopToGo: {
        required: true,
        type: Number,
    },
    current: {
        type: Boolean,
        default: true
    }
});

const Timeslot = mongoose.model('timeslot', timeslotSchema);
module.exports = mongoose.model('timeslot');