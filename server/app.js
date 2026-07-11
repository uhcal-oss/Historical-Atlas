const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors')
const userRoutes = require('./routes/user');
const mapRoutes = require('./routes/map');
const iconMarkerRoutes = require('./routes/iconMarker');

const path = require('path');

const app = express();

/*
app.use(cors({
    origin: ['http://141.94.244.143', 'http://localhost', 'http://www.histoatlas.org'],
    methods: ['GET','POST','DELETE','UPDATE','PUT','PATCH']
}));
*/

app.use((req, res, next) => {
  console.log(`[DEBUG] REQ ${req.method} ${req.originalUrl}`);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  next();
});


app.use(bodyParser.json({ limit: '100mb' }))

//app.use(express.limit('2mb'));
app.use(express.json()); 

app.options('*', cors()) 

/* app.use('/images', express.static(path.join(__dirname, 'images'))); */

// 1. Your API Routes
app.use('/api/user', userRoutes);
app.use('/api/map', mapRoutes);
app.use('/api/iconMarker', iconMarkerRoutes);

// 2. Serve Frontend Static Files
// This serves all the CSS, JS, and image files inside the 'src' folder
app.use(express.static(path.join(__dirname, '../src')));

// 3. Fallback Route
// If someone visits the main page or any page route, send them the main index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../src/index.html'));
});

module.exports = app;
