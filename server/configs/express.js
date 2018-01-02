const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const morgan = require('morgan');
const rootPath = path.normalize(__dirname + '/../../');

module.exports = function(app){
    app.use(bodyParser.urlencoded({
        extended: true
    }));
    app.use(bodyParser.json());
    app.use(morgan('dev'));
    app.use(express.static(rootPath + 'dist'));

    app.use((req, res, next)=>{
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET,POST,DELETE');
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
    });

    app.set('views', rootPath + 'dist');
    app.engine('html', require('ejs').renderFile);
    app.set('view engine', 'html');
}
