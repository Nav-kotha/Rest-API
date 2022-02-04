const mongoose = require('mongoose');

let User = new mongoose.Schema({
    username :{
        type : String,
        required : true
    },
    email :{
        type : String,
        required : true,
        unique : true
    },
    password :{
        type : String,
        required:true
    },
    role: {
      type: Number,
      default: 0
    }
})

//user has been given default role as 0
//Admin: role = 1

module.exports = mongoose.model('user',User);