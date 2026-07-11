const config = require('../params/config');
const user = require('./user');
const fs = require('fs');
const url = require('url');
const log = require("./log");

const Map = require('../models/Map');

exports.save = (req, res, next) => {
  console.log(`[DEBUG] MAP SAVE | user: ${req.body.user} | fileName: ${req.body.fileName} | exist: ${req.body.exist} | name: ${req.body.name} | content length: ${req.body.content ? req.body.content.length : 'NONE'}`);
  let folderUrl = `files/${req.body.user}`;
  let fileUrl = `${folderUrl}/${req.body.fileName}.json`;

  if (!fs.existsSync(folderUrl)) {
    console.log(`[DEBUG] MAP SAVE | creating folder: ${folderUrl}`);
    fs.mkdirSync(folderUrl, { recursive: true });
  }

  fs.writeFile(fileUrl, req.body.content, function(err) {
    if (err) {
      console.log(`[DEBUG] MAP SAVE | writeFile FAILED | ${err.message}`);
      return res.status(500).json({ error: 'SERVER_CREATION_SAVE_FILE_FAIL' });
    }
    console.log(`[DEBUG] MAP SAVE | file written: ${fileUrl}`);

    user.getUserIdFromName(req.body.user).then((userId) => {
      console.log(`[DEBUG] MAP SAVE | getUserIdFromName OK | userId: ${userId}`);
      config.connectDB().then(() => {
        log.log("saveMap", { user: req.body.user, fileUrl: fileUrl });

        if (req.body.exist) {
          console.log(`[DEBUG] MAP SAVE | updating existing map | query: {name: ${req.body.name}, user: ${userId}}`);
          Map.updateOne(
            { name: req.body.name, user: userId },
            { lang: req.body.lang, category: req.body.type, public: req.body.public, update_date: new Date() }
          ).then(() => {
            console.log(`[DEBUG] MAP SAVE | update OK | insertId: ${req.body.id}`);
            res.status(200).json({ insertId: req.body.id });
          }).catch(error => {
            console.log(`[DEBUG] MAP SAVE | update FAILED | ${error}`);
            res.status(500).json({ error: 'SERVER_SAVE_QUERY_FAIL' });
          });
        } else {
          console.log(`[DEBUG] MAP SAVE | creating new map`);
          const map = new Map({
            user: userId,
            userName: req.body.user,
            name: req.body.name,
            url: fileUrl,
            lang: req.body.lang,
            category: req.body.type,
            public: req.body.public,
            update_date: new Date(),
            creation_date: new Date()
          });

          map.save().then((result) => {
            console.log(`[DEBUG] MAP SAVE | create OK | insertId: ${result._id}`);
            res.status(200).json({ insertId: result._id });
          }).catch(error => {
            console.log(`[DEBUG] MAP SAVE | create FAILED | ${error}`);
            res.status(500).json({ error: 'SERVER_SAVE_QUERY_FAIL' });
          });
        }
      }).catch((e) => {
        console.log(`[DEBUG] MAP SAVE | connectDB FAILED | ${e}`);
        res.status(500).json({ error: 'SERVER_CONNEXION_DATABASE_FAIL' });
      });
    }).catch((e) => {
      console.log(`[DEBUG] MAP SAVE | getUserIdFromName FAILED | ${e}`);
      res.status(500).json({ error: 'SERVER_CONNEXION_DATABASE_FAIL' });
    });
  });
}

exports.checkIfFileExist = (req, res, next) => {
  console.log(`[DEBUG] MAP checkIfFileExist | user: ${req.body.user} | name: ${req.body.name}`);
  config.connectDB().then(() => {
    Map.findOne({ userName: req.body.user, name: req.body.name }).then(map => {
      if (map) {
        console.log(`[DEBUG] MAP checkIfFileExist | FOUND | id: ${map._id}`);
        res.status(200).json({ exist: true, id: map._id });
      } else {
        console.log(`[DEBUG] MAP checkIfFileExist | NOT FOUND`);
        res.status(200).json({ exist: false, id: null });
      }
    }).catch(error => {
      console.log(`[DEBUG] MAP checkIfFileExist | query FAILED | ${error}`);
      res.status(500).json({ error: 'SERVER_QUERY_FAIL' });
    });
  }).catch((e) => {
    console.log(`[DEBUG] MAP checkIfFileExist | connectDB FAILED | ${e}`);
    res.status(500).json({ error: 'SERVER_CONNEXION_DATABASE_FAIL' });
  });
}

exports.getVisibleMapsOfUser = (req, res, next) => {
  config.connectDB().then(() => {
    Map.find({ userName: req.params.user }).sort({ update_date: -1 }).then(userMaps => {
      res.status(200).json({ userMaps: userMaps });
    }).catch(error => { res.status(500).json({ error: 'SERVER_QUERY_FAIL' }) });
  }).catch((e) => { res.status(500).json({ error: 'SERVER_CONNEXION_DATABASE_FAIL' }) });
}

exports.getVisibleMaps = (req, res, next) => {
  config.connectDB().then(() => {
    Map.find({ public: true, userName: { $ne: req.params.user } }).sort({ update_date: -1 }).then(publicMaps => {
      const result = publicMaps.map(m => ({
        ...m.toJSON(),
        user_name: m.userName
      }));
      res.status(200).json({ publicMaps: result });
    }).catch(error => { res.status(500).json({ error: 'SERVER_QUERY_FAIL' }) });
  }).catch((e) => { res.status(500).json({ error: 'SERVER_CONNEXION_DATABASE_FAIL' }) });
}

exports.getMap = (req, res, next) => {
  let userParam = url.parse(req.url, true).query.user;
  let editMode = url.parse(req.url, true).query.editMode;
  let mapbox = url.parse(req.url, true).query.mapbox;

  config.connectDB().then(() => {
    let query = { _id: req.params.id };
    if (userParam) {
      if (editMode == true || editMode == "true") {
        query.$or = [
          { userName: userParam },
          { public: true, public_editable: true }
        ];
      } else {
        query.$or = [
          { userName: userParam },
          { public: true }
        ];
      }
    } else {
      query.public = true;
    }

    Map.findOne(query).then(map => {
      if (!map) return res.status(500).json({ error: 'La carte est inaccessible' });

      this.getMapManageResult(map, editMode, mapbox, userParam, res);
    }).catch(error => { res.status(500).json({ error: 'SERVER_QUERY_FAIL' }) });
  }).catch((e) => { res.status(500).json({ error: 'SERVER_CONNEXION_DATABASE_FAIL' }) });
}

exports.getMapGuest = (req, res, next) => {
  let editMode = url.parse(req.url, true).query.editMode;
  let mapbox = url.parse(req.url, true).query.mapbox;

  config.connectDB().then(() => {
    let query = { _id: req.params.id };
    if (editMode == true || editMode == "true") {
      query.public = true;
      query.public_editable = true;
    } else {
      query.public = true;
    }

    Map.findOne(query).then(map => {
      if (!map) return res.status(500).json({ error: 'La carte est inaccessible' });

      this.getMapManageResult(map, editMode, mapbox, "", res);
    }).catch(error => { res.status(500).json({ error: 'SERVER_QUERY_FAIL' }) });
  }).catch((e) => { res.status(500).json({ error: 'SERVER_CONNEXION_DATABASE_FAIL' }) });
}

exports.getMapManageResult = (map, editMode, mapbox, userName, res) => {
  let views = map.views;
  if (editMode == false || editMode == "false" || map.userName != userName) {
    views++;
  }

  Map.updateOne({ _id: map._id }, { views: views }).then(() => {
    fs.readFile(map.url, 'utf8', function(err, data) {
      if (err) {
        console.log(err);
        return res.status(500).json({ error: 'SERVER_READ_FILE_FAIL' });
      }

      log.log("getMap", { name: map.name, editMode: editMode, mapbox: mapbox, url: map.url });
      res.status(200).json({
        data: data,
        views: views,
        name: map.name,
        lang: map.lang,
        type: map.category,
        userName: map.userName
      });
    });
  }).catch(error => { res.status(500).json({ error: 'SERVER_QUERY_FAIL' }) });
}

exports.changePublicState = (req, res, next) => {
  config.connectDB().then(() => {
    Map.updateOne(
      { _id: req.body.id, userName: req.body.user },
      { public: req.body.public }
    ).then(() => {
      res.status(200).json({});
    }).catch(error => { res.status(500).json({ error: 'SERVER_QUERY_FAIL' }) });
  }).catch((e) => { res.status(500).json({ error: 'SERVER_CONNEXION_DATABASE_FAIL' }) });
}

exports.changeEditableState = (req, res, next) => {
  config.connectDB().then(() => {
    Map.updateOne(
      { _id: req.body.id, userName: req.body.user },
      { public_editable: req.body.public_editable }
    ).then(() => {
      res.status(200).json({});
    }).catch(error => { res.status(500).json({ error: 'SERVER_QUERY_FAIL' }) });
  }).catch((e) => { res.status(500).json({ error: 'SERVER_CONNEXION_DATABASE_FAIL' }) });
}

exports.delete = (req, res, next) => {
  config.connectDB().then(() => {
    Map.findOne({ _id: req.body.id }).then(map => {
      if (!map) return res.status(500).json({ error: 'SERVER_QUERY_FAIL' });

      let fileUrl = map.url;

      Map.deleteOne({ _id: req.body.id, userName: req.body.user }).then(() => {
        fs.unlink(fileUrl, (err) => {
          log.log("delete", { name: req.body.user, mapId: req.body.id, fileUrl: fileUrl });

          if (err) {
            return res.status(500).json({ error: 'Impossible de supprimer le fichier' });
          }

          res.status(200).json({});
        });
      }).catch(error => { res.status(500).json({ error: 'SERVER_QUERY_FAIL' }) });
    }).catch(error => { res.status(500).json({ error: 'SERVER_QUERY_FAIL' }) });
  }).catch((e) => { res.status(500).json({ error: 'SERVER_CONNEXION_DATABASE_FAIL' }) });
}

exports.createNewMap = (req, res, next) => {
  log.log("createNewMap", {});
}

exports.rename = (req, res, next) => {
  let folderUrl = `files/${req.body.user}`;
  let fileUrl = `${folderUrl}/${req.body.fileName}.json`;

  config.connectDB().then(() => {
    Map.findOne({ _id: req.body.id }).then(map => {
      if (map) {
        let oldUrl = map.url;

        Map.updateOne(
          { _id: req.body.id },
          { name: req.body.newName, url: fileUrl }
        ).then(() => {
          fs.rename(oldUrl, fileUrl, function() {
            log.log("renameMap", { name: req.body.user, oldFileUrl: oldUrl, newFileUrl: fileUrl, new_name: req.body.newName, id: req.body.id });
            res.status(200).json({});
          });
        }).catch(error => { res.status(500).json({ error: 'SERVER_QUERY_FAIL' }) });
      } else {
        res.status(500).json({ error: 'SERVER_QUERY_FAIL' });
      }
    }).catch(error => { res.status(500).json({ error: 'SERVER_QUERY_FAIL' }) });
  }).catch((e) => { res.status(500).json({ error: 'SERVER_CONNEXION_DATABASE_FAIL' }) });
}

exports.changeCategory = (req, res, next) => {
  config.connectDB().then(() => {
    Map.updateOne(
      { _id: req.body.id },
      { category: req.body.newCategory }
    ).then(() => {
      res.status(200).json({});
      log.log("renameMap", { name: req.body.user, newCategory: req.body.newCategory, id: req.body.id });
    }).catch(error => { res.status(500).json({ error: 'SERVER_QUERY_FAIL' }) });
  }).catch((e) => { res.status(500).json({ error: 'SERVER_CONNEXION_DATABASE_FAIL' }) });
}
