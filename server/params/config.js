const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

exports.connectDB = () => {
  return new Promise((resolve, reject) => {
    if (mongoose.connection.readyState === 1) return resolve(mongoose.connection);
    const uri = process.env.MONGODB_URI;
    if (!uri) return reject(new Error('MONGODB_URI not set in .env'));
    mongoose.connect(uri)
      .then(() => resolve(mongoose.connection))
      .catch(err => reject(err));
  });
};

exports.getTokenKey = () => {
  return new Promise((resolve, reject) => {
    fs.readFile("params/config.json", "utf8", (err, data) => {
      if (err) return reject(err);
      const dataObj = JSON.parse(data);
      resolve(dataObj["tokenKey"]);
    });
  });
};

exports.getMailInfos = () => {
  return new Promise((resolve, reject) => {
    fs.readFile("params/config.json", "utf8", (err, data) => {
      if (err) return reject(err);
      const dataObj = JSON.parse(data);
      resolve(dataObj["mail"]);
    });
  });
};
