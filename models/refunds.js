const mongoose = require('mongoose');

const refundSchema = new mongoose.Schema({
    refundId: {
        type: String,
        required: true
    },
    orderId: {
        type: String,
        required: true
    },
    amount: {
        type: String,
        required: true
    }
});

const Refund = mongoose.model('refund', refundSchema);
module.exports = mongoose.model('refund');