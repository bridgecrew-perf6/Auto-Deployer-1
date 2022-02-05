const http = require('http');
const express = require('express');
const https = require('https');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const dotenv = require('dotenv').config();

const { CommandManager } = require('@jodu555/commandmanager');
CommandManager.createCommandManager(process.stdin, process.stdout);
require('./utils/commands');

const fs = require('fs');
if (!fs.existsSync('deployments'))
    fs.mkdirSync('deployments');
if (!fs.existsSync('history'))
    fs.mkdirSync('history');

const { setupConfig } = require('./utils/utils');
setupConfig();

require('./utils/deploys');

const Webhook = require('./classes/Webhook');

const wh = new Webhook({ name: 'LOL', type: 'discord', url: '' })


const app = express();
app.use(cors());
app.use(morgan('dev'));
app.use(helmet());
app.use(express.json());

let server;
if (process.env.https) {
    const sslProperties = {
        key: fs.readFileSync(process.env.KEY_FILE),
        cert: fs.readFileSync(process.env.CERT_FILE),
    };
    server = https.createServer(sslProperties, app)
} else {
    server = http.createServer(app);
}

const { errorHandling, notFound, githubSignatureVerifier } = require('./utils/middleware');

// Your Middleware handlers here

const { webhook } = require('./routes/webhook');

app.post('/webhook', githubSignatureVerifier, webhook);


app.use('*', notFound);
app.use(errorHandling);

const PORT = process.env.PORT || 3100;
server.listen(PORT, () => {
    console.log(`Express App Listening ${process.env.https ? 'with SSL ' : ''}on ${PORT}`);
});