const mongoose = require("mongoose");

const ProgressSchema = new mongoose.Schema({
    student: {
        type: String,
        required: true,
    },
    subjects: {
        type: [{
            name: {
                type: String,
                required: true,
            },
            grade: {
                type: String,
                required: true,
            },
        }],
        required: true,
    },
    remark: {
        type: String,
    },
    month: {
        type: String,
        required: true,
    },
    created: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("Progress", ProgressSchema);
