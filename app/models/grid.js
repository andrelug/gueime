var mongoose = require('mongoose');


var GridSchema = new mongoose.Schema({

    grid: {type: Array, default: [{col:1,row:1,size_x:3,size_y:3},{col:6,row:1,size_x:1,size_y:1},{col:8,row:1,size_x:1,size_y:1},{col:4,row:1,size_x:2,size_y:1}]},
    name: String
});

// create the model for users and expose it to app // Game var
module.exports = mongoose.model('Grid', GridSchema);
