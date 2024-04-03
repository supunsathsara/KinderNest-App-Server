const mongoose = require("mongoose");

// Schema for Payment from Paypal
const PaymentSchema = new mongoose.Schema({
    paymentId: {
        type: String,
        required: true,
    },
    payerId: {
        type: String,
        required: true,
    },
    paymentState: {
        type: String,
        required: true,
    },
    amount: {
        type: String,
        required: true,
    },
    month: {
        type: String,
        required: true,
    },

});

module.exports = mongoose.model('Payment', PaymentSchema);