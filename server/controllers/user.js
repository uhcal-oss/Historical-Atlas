const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../params/config');
const nodemailer = require('nodemailer');
const url = require('url');
const { v4: uuidv4 } = require('uuid');
const log = require("./log");

const User = require('../models/User');
const PasswordReset = require('../models/PasswordReset');
const Newsletter = require('../models/Newsletter');

exports.login = (req, res, next) => {
  config.connectDB().then(() => {
    User.findOne({
      $or: [{ name: req.body.name }, { mail: req.body.name }]
    }).then(user => {
      if (!user) {
        log.log("login", { name: req.body.name, succes: false });
        return res.status(401).json({ error: 'SERVER_USER_OR_PASS_INVALID' });
      }

      bcrypt.compare(req.body.password, user.password).then(valid => {
        if (!valid) {
          log.log("login", { name: req.body.name, succes: false });
          return res.status(401).json({ error: 'SERVER_USER_OR_PASS_INVALID' });
        }

        user.login_date = new Date();
        user.save().then(() => {
          log.log("login", { name: req.body.name, succes: true });

          config.getTokenKey().then(tokenKey => {
            res.status(201).json({
              userId: user.name,
              token: jwt.sign(
                { userId: user.name },
                tokenKey,
                { expiresIn: '24h' }
              )
            });
          }).catch(error => res.status(500).json({ error: "SERVER_READ_CONFIG_FAIL" }));
        }).catch(error => res.status(500).json({ error: 'SERVER_DATABASE_UPDATE_FAIL' }));
      }).catch(error => res.status(500).json({ error }));
    }).catch(error => res.status(500).json({ error }));
  }).catch(error => res.status(500).json({ error }));
}

exports.registration = (req, res, next) => {
  bcrypt.hash(req.body.password, 10).then(hash => {
    config.connectDB().then(() => {
      User.findOne({ name: req.body.name }).then(userByName => {
        if (userByName) {
          return res.status(500).json({ error: "SERVER_USER_NAME_NOT_AVAILABLE" });
        }

        User.findOne({ mail: req.body.mail }).then(userByMail => {
          if (userByMail) {
            return res.status(500).json({ error: "SERVER_MAIL_NOT_AVAILABLE" });
          }

          const now = new Date();
          const user = new User({
            name: req.body.name,
            password: hash,
            mail: req.body.mail,
            admin: false,
            lang: req.body.lang,
            newsletter: req.body.newsletter,
            registration_date: now,
            login_date: now
          });

          user.save().then(() => {
            log.log("registration", { name: req.body.name, mail: req.body.mail, lang: req.body.lang, newsletter: req.body.newsletter, succes: true });

            config.getTokenKey().then(tokenKey => {
              res.status(200).json({
                userId: req.body.name,
                token: jwt.sign(
                  { userId: req.body.name },
                  tokenKey,
                  { expiresIn: '24h' }
                )
              });
            }).catch(error => res.status(500).json({ error: "SERVER_READ_CONFIG_FAIL" }));
          }).catch(error => {
            log.log("registration", { name: req.body.name, mail: req.body.mail, lang: req.body.lang, newsletter: req.body.newsletter, succes: false });
            res.status(500).json({ error: 'SERVER_QUERY_CREATION_FAIL' });
          });
        }).catch(error => {
          log.log("registration", { name: req.body.name, mail: req.body.mail, lang: req.body.lang, newsletter: req.body.newsletter, succes: false });
          res.status(500).send({ error: 'SERVER_QUERY_FAIL' });
        });
      }).catch(error => {
        log.log("registration", { name: req.body.name, mail: req.body.mail, lang: req.body.lang, newsletter: req.body.newsletter, succes: false });
        res.status(500).send({ error: 'SERVER_QUERY_FAIL' });
      });
    }).catch(error => res.status(500).json({ error }));
  }).catch(error => res.status(500).json({ error }));
}

exports.getUserIdFromName = (name) => {
  return new Promise((resolve, reject) => {
    config.connectDB().then(() => {
      User.findOne({ name: name }).then(user => {
        if (user) {
          resolve(user._id);
        } else {
          reject();
        }
      }).catch(error => reject(error));
    }).catch(error => reject(error));
  });
}

exports.checkValidUser = (req, res, next) => {
  res.status(200).json({});
}

exports.sendMail = (req, res, next) => {
  config.getMailInfos().then(mailInfos => {
    let mailContent = `mail : ${req.body.mail} \n name : ${req.body.name} \n \n ${req.body.message}`;

    var transporter = nodemailer.createTransport({
      host: mailInfos['host'],
      port: mailInfos['port'],
      auth: {
        user: mailInfos['auth_user'],
        pass: mailInfos['auth_pass'],
      },
      tls: {
        rejectUnauthorized: false
      },
    });
    var mailOptions = {
      from: req.body.mail,
      to: mailInfos['to'],
      subject: "[HistoAtlas] " + req.body.title,
      text: mailContent
    };

    transporter.sendMail(mailOptions, function(error, info) {
      if (error) {
        res.status(500).send({});
      } else {
        res.status(200).send({});
      }
    });
  }).catch(error => res.status(500).send({}));
}

exports.getMail = (req, res, next) => {
  let userName = url.parse(req.url, true).query.user;

  config.connectDB().then(() => {
    User.findOne({ name: userName }).then(user => {
      if (user) {
        res.status(200).send({ mail: user.mail });
      } else {
        res.status(500).send({});
      }
    }).catch(error => res.status(500).send({}));
  }).catch(error => res.status(500).send({}));
}

exports.changeMail = (req, res, next) => {
  config.connectDB().then(() => {
    User.updateOne({ name: req.body.user }, { mail: req.body.mail }).then(() => {
      res.status(200).send({});
    }).catch(error => res.status(500).send({}));
  }).catch(error => res.status(500).send({}));
}

exports.changePassword = (req, res, next) => {
  bcrypt.hash(req.body.password, 10).then(hash => {
    config.connectDB().then(() => {
      User.updateOne({ name: req.body.user }, { password: hash }).then(() => {
        res.status(200).send({});
      }).catch(error => res.status(500).send({}));
    }).catch(error => res.status(500).send({}));
  }).catch(error => res.status(500).json({ error }));
}

exports.forgotPassword = (req, res, next) => {
  config.connectDB().then(() => {
    let generated_key = uuidv4();

    User.findOne({
      $or: [{ name: req.body.userName }, { mail: req.body.userName }]
    }).then(user => {
      if (user) {
        let targetMail = user.mail;

        const passwordReset = new PasswordReset({
          user_name: req.body.userName,
          generated_key: generated_key,
          date: new Date()
        });

        passwordReset.save().then(() => {
          config.getMailInfos().then(mailInfos => {
            let mailContent = `${req.body.messagePart1} : http://www.histoatlas.org/pages/resetPassword.html?token=${generated_key} \n\n${req.body.messagePart2}`;

            var transporter = nodemailer.createTransport({
              host: mailInfos['host'],
              port: mailInfos['port'],
              auth: {
                user: mailInfos['auth_user'],
                pass: mailInfos['auth_pass'],
              },
              tls: {
                rejectUnauthorized: false
              },
            });
            var mailOptions = {
              from: mailInfos['auth_user'],
              to: targetMail,
              subject: req.body.messageTitle,
              text: mailContent
            };

            transporter.sendMail(mailOptions, function(error, info) {
              if (error) {
                res.status(500).send({ error: "SERVER_MAIL_SEND_FAIL" });
              } else {
                res.status(200).send({});
              }
            });
          }).catch(error => res.status(500).send({ error: "SERVER_QUERY_FAIL" }));
        }).catch(error => res.status(500).send({ error: "SERVER_QUERY_FAIL" }));
      } else {
        res.status(500).send({ error: "SERVER_USER_NOT_EXIST" });
      }
    }).catch(error => res.status(500).send({ error: "SERVER_QUERY_FAIL" }));
  }).catch(error => res.status(500).json({ error }));
}

exports.resetPasswordGet = (req, res, next) => {
  let token = req.params.token;

  config.connectDB().then(() => {
    this.resetPasswordCheckVality(token)
      .then(() => {
        res.status(200).send({});
      })
      .catch((error) => { res.status(500).send({ error: error }) });
  }).catch(error => res.status(500).json({ error }));
}

exports.resetPassword = (req, res, next) => {
  let token = req.body.token;

  config.connectDB().then(() => {
    this.resetPasswordCheckVality(token)
      .then((userName) => {
        bcrypt.hash(req.body.password, 10).then(hash => {
          User.updateOne({ name: userName }, { password: hash }).then(() => {
            log.log("forgotPassword", { name: userName });
            res.status(200).send({});
          }).catch(error => { res.status(500).send({ error: "SERVER_QUERY_FAIL" }); });
        }).catch(error => { res.status(500).json({ error }) });
      })
      .catch((error) => { res.status(500).send({ error: error }) });
  }).catch(error => res.status(500).json({ error }));
}

exports.resetPasswordCheckVality = (token) => {
  return new Promise((resolve, reject) => {
    PasswordReset.findOne({ generated_key: token }).then(result => {
      if (result) {
        let actualDate = new Date();
        let dbDate = new Date(result.date);
        let diffTime = Math.abs(dbDate - actualDate);
        let diffDays = diffTime / (1000 * 60 * 60 * 24);

        if (diffDays > 1) {
          reject("SERVER_KEY_EXPIRED");
        } else {
          resolve(result.user_name);
        }
      } else {
        reject("SERVER_KEY_INVALID");
      }
    }).catch(error => { reject("SERVER_KEY_INVALID"); });
  });
}

exports.delete = (req, res, next) => {
  config.connectDB().then(() => {
    User.deleteOne({ name: req.body.user }).then(() => {
      res.status(200).send({});
    }).catch(error => { res.status(500).send({}); });
  }).catch(error => { res.status(500).send({}); });
}

exports.getNewsletterState = (req, res, next) => {
  let userName = url.parse(req.url, true).query.user;

  config.connectDB().then(() => {
    User.findOne({ name: userName }).then(user => {
      if (user) {
        res.status(200).send({ newsletter: user.newsletter });
      } else {
        res.status(500).send({});
      }
    }).catch(error => { res.status(500).send({}); });
  }).catch(error => { res.status(500).send({}); });
}

exports.changeNewsletterState = (req, res, next) => {
  config.connectDB().then(() => {
    User.updateOne(
      { $or: [{ name: req.body.user }, { mail: req.body.user }] },
      { newsletter: req.body.newsletter }
    ).then(() => {
      if (req.body.newsletter == false) {
        Newsletter.deleteOne({ mail: req.body.user }).then(() => {
          res.status(200).send({});
        }).catch(error => { res.status(500).send({ error: "SERVER_QUERY_FAIL" }); });
      } else {
        res.status(200).send({});
      }
    }).catch(error => { res.status(500).send({ error: "SERVER_QUERY_FAIL" }); });
  }).catch(error => { res.status(500).send({ error: "SERVER_QUERY_FAIL" }); });
}

exports.addNewsletterMail = (req, res, next) => {
  config.connectDB().then(() => {
    log.log("addNewsletter", { mail: req.body.mail, lang: req.body.lang });

    Newsletter.findOne({ mail: req.body.mail }).then(existing => {
      if (!existing) {
        const newsletter = new Newsletter({
          mail: req.body.mail,
          lang: req.body.lang
        });

        newsletter.save().then(() => {
          res.status(200).send({});
        }).catch(error => { res.status(500).send({ error: "SERVER_QUERY_FAIL" }); });
      } else {
        res.status(500).send({ error: "SERVER_NEWSLETTER_ALREADY_SUBSCRIBER" });
      }
    }).catch(error => { res.status(500).send({ error: "SERVER_QUERY_FAIL" }); });
  }).catch(error => { res.status(500).send({}); });
}
