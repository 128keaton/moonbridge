const path = require("path");
const fs = require("fs");
const axios = require('axios');
const express = require('express')
const cors = require('cors');


let printers = [];
let port = 3000;


try {
    const config = fs.readFileSync(path.resolve(process.cwd(), 'config.json'), {
        encoding: "utf8"
    });

    const parsedConfig = JSON.parse(config);

    if (parsedConfig.hasOwnProperty('printers'))
        printers = parsedConfig.printers;


    if (parsedConfig.hasOwnProperty('port'))
        port = parsedConfig.port;

} catch (err) {
    console.error(err);
}


const app = express();
app.use(cors({
    origin: '*'
}));

const getPrinterStatus = (printer, extended = false) => {
    //  /api/printer
    return axios.get(extended ? `${printer}/printer/objects/query?webhooks\&virtual_sdcard` : `${printer}/api/printer`)
        .then(res => res.data)
        .catch(err => {
            console.log('Error: ', err.message);
        });
}


app.get('/', (req, res) => {
    const printerNames = printers.map(p => p.name);
    let partialArrayResponse = [];

    Promise.all(printers.map(printer => getPrinterStatus(printer.endpoint)))
        .then(respArray => {

            respArray = respArray.filter(r => !!r);

            respArray.forEach((resp, index) => {
                resp.name = printerNames[index];
            });

            partialArrayResponse = respArray;

            return Promise.all(printers.map(printer => getPrinterStatus(printer.endpoint, true)));
        }).then(respArray => {
            respArray = respArray.filter(r => !!r);

            partialArrayResponse.forEach((o, index) => {
                o.extended = respArray[index];
            });

            res.send(partialArrayResponse);
    })
});


app.listen(port, () => {
    console.log(printers.length, "printers");
    console.log(`Moonbridge listening on port ${port}`);
});
