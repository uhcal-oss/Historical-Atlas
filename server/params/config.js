const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

exports.connectDB = () => {
  return new Promise((resolve, reject) => {
    const readyState = mongoose.connection.readyState;
    if (readyState === 1) {
      console.log(`[DEBUG] connectDB | already connected (readyState=${readyState})`);
      return resolve(mongoose.connection);
    }
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.log(`[DEBUG] connectDB | FAILED | MONGODB_URI not set in .env`);
      return reject(new Error('MONGODB_URI not set in .env'));
    }
    console.log(`[DEBUG] connectDB | connecting... (readyState=${readyState})`);
    mongoose.connect(uri)
      .then(() => {
        console.log(`[DEBUG] connectDB | connected OK`);
        resolve(mongoose.connection);
      })
      .catch(err => {
        console.log(`[DEBUG] connectDB | FAILED | ${err.message}`);
        reject(err);
      });
  });
};

exports.getTokenKey = () => {
  return new Promise((resolve, reject) => {
    fs.readFile("params/config.json", "utf8", (err, data) => {
      if (err) {
        console.log(`[DEBUG] getTokenKey | FAILED | ${err.message}`);
        return reject(err);
      }
      const dataObj = JSON.parse(data);
      console.log(`[DEBUG] getTokenKey | OK`);
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
