const express = require('express');
let app = express();

let env = process.env.NODE_ENV = process.env.NODE_ENV || 'development';
global.config = require('./server/configs')[env];
require('./server/configs/express')(app);
require('./server/configs/mongoose')(config);
require('./server/models');
require('./server/routes')(app);

app.listen(config.port, config.host, ()=>{
	console.log(`Server Running at: http://${config.host}:${config.port}/ on ${env} enviornment`);
});
