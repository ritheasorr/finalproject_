var mongoose = require('mongoose');

function connectMongo() {
  var mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/finalproject';

  mongoose.connection.on('connected', function() {
    console.log('MongoDB connected');
  });

  mongoose.connection.on('error', function(err) {
    console.error('MongoDB connection error:', err.message);
  });

  mongoose.connection.on('disconnected', function() {
    console.warn('MongoDB disconnected');
  });

  return mongoose.connect(mongoUri, {
    autoIndex: true
  });
}

module.exports = connectMongo;
