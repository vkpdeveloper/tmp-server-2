const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
    serviceRadius: {
        type: Number,
        required: true
    },
    deliveryChargesOnLow: {
        type: Number,
        required: true
    },
    lowPriceDelivery: {
        type: Number,
        default: 0
    },
    higherPriceDelivery: {
        type: Number,
        default: 0
    },
    deliveryChargesOnHigh: {
        type: Number,
        required: true
    },
    centerOfService: {
        type: Array,
        required: true
    },
    minOrderPrice: {
        type: Number,
        required: true
    },
    valueOnCouponUsable: {
        type: Number,
        required: true
    },
    sodexoBaseUrl: {
        type: String,
        required: true
    },
    testIds: {
        type: Array,
        default: []
    },
    googleMapKey: {
        type: String,
        default: ''
    },
    currentAndroidAppVersion: {
        type: String,
        required: true
    },
    currentiOSAppVersion: {
        type: String,
        required: true
    },
    appUpdateTitle: {
        type: String,
        required: true
    },
    appUpdateMessage: {
        type: String,
        required: true
    },
    current: {
        type: Boolean,
        default: true
    }
});

const Setting = mongoose.model('setting', settingSchema);
module.exports = mongoose.model('setting');