const jwt = require('jsonwebtoken');
const config = require('../params/config');

module.exports = (req, res, next) => {
  console.log(`[DEBUG] AUTH ${req.method} ${req.originalUrl} | token: ${req.headers.authorization ? req.headers.authorization.substring(0, 20) + '...' : 'MISSING'} | body.user: ${req.body && req.body.user}`);

  config.getTokenKey().then((tokenKey) => {
    try {
      //const token = req.headers.authorization.split(' ')[1];
      const token = req.headers.authorization;
      const decodedToken = jwt.verify(token, tokenKey);
      const userId = decodedToken.userId;
      console.log(`[DEBUG] AUTH OK | userId: ${userId}`);
      //console.log("userId : " + userId);
      
      if (req.body.user && req.body.user !== userId) 
      {
        console.log(`[DEBUG] AUTH FAIL | body.user '${req.body.user}' !== token userId '${userId}'`);
        res.status(401).json({ error: 'Utilisateur non connecté' });
      } else 
      {
        next();
      }
      
    } catch (err) {
      console.log(`[DEBUG] AUTH ERROR | ${err.message}`);
      res.status(401).json({ error: 'Utilisateur non connecté' });
    }
  }).catch(error => {
    console.log(`[DEBUG] AUTH CONFIG ERROR | ${error}`);
    res.status(500).json({ error : "Echec de lecture de la configuration du server" });
  });
};