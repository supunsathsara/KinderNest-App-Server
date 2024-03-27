const mongoose = require("mongoose");

const ClassSchema = new mongoose.Schema({
   session: {
    type: String,
    required: true,
   },
   date: {
    type: Date,
    required: true,
   },
   time: {
    type: String,
    required: true,
   },
   class:{
    type: String,
    required: true,
   },
   teacher: {
    type: String,
    required: true,
   }
    });


module.exports = mongoose.model('Class', ClassSchema);
