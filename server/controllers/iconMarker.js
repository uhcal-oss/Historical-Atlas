const config = require('../params/config');
const user = require('./user');
const fs = require('fs');
const log = require("./log");

const IconMarker = require('../models/IconMarker');

exports.add = (req, res, next) => {
  let date = new Date();
  let fileName = `${req.body.fileName.split(".")[0]}_${date.getFullYear()}${date.getMonth()}${date.getDate()}_${date.getHours()}${date.getMinutes()}${date.getSeconds()}.svg`;
  let folderUrl = `icons/${req.body.user}`;
  let fileUrl = `${folderUrl}/${fileName}`;

  if (!fs.existsSync(folderUrl)) {
    fs.mkdirSync(folderUrl, { recursive: true });
  }

  fs.writeFile(fileUrl, req.body.fileContent, { encoding: 'utf8' }, function(err) {
    if (err) return res.status(500).json({ error: 'SERVER_CREATION_SAVE_FILE_FAIL' });

    user.getUserIdFromName(req.body.user).then((userId) => {
      config.connectDB().then(() => {
        log.log("addIcon", { user: req.body.user, fileUrl: fileUrl });

        const iconMarker = new IconMarker({
          user: userId,
          userName: req.body.user,
          file_name: fileName,
          url: fileUrl
        });

        iconMarker.save().then(() => {
          res.status(200).json({});
        }).catch(error => { res.status(500).json({ error: 'SERVER_SAVE_QUERY_FAIL' }) });
      }).catch((e) => { res.status(500).json({ error: 'SERVER_CONNEXION_DATABASE_FAIL' }) });
    }).catch((e) => { res.status(500).json({ error: 'SERVER_CONNEXION_DATABASE_FAIL' }) });
  });
}

exports.get = (req, res, next) => {
  config.connectDB().then(() => {
    IconMarker.find({ userName: req.params.user }).then(iconsMarkers => {
      res.status(200).json({ iconsMarkers: iconsMarkers });
    }).catch(error => { res.status(500).json({ error: 'SERVER_QUERY_FAIL' }) });
  }).catch((e) => { res.status(500).json({ error: 'SERVER_CONNEXION_DATABASE_FAIL' }) });
}

var mime = {
  html: 'text/html',
  txt: 'text/plain',
  css: 'text/css',
  gif: 'image/gif',
  jpg: 'image/jpeg',
  png: 'image/png',
  svg: 'image/svg+xml',
  js: 'application/javascript'
};

exports.getImage = (req, res, next) => {
  config.connectDB().then(() => {
    IconMarker.findById(req.params.id).then(iconMarker => {
      if (!iconMarker) {
        return res.status(404).end('Not found');
      }

      var type = "image/svg+xml";
      var s = fs.createReadStream(iconMarker.url);
      s.on('open', function() {
        res.set('Content-Type', type);
        s.pipe(res);
      });
      s.on('error', function() {
        res.set('Content-Type', 'text/plain');
        res.status(404).end('Not found');
      });
    }).catch(error => { res.status(500).json({ error: 'SERVER_QUERY_FAIL' }) });
  }).catch((e) => { res.status(500).json({ error: 'SERVER_CONNEXION_DATABASE_FAIL' }) });
}
