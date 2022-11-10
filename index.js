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

const getPrinterStatus = (printer) => {
    //  /api/printer
    return axios.get(`${printer}/api/printer`)
        .then(res => res.data)
        .catch(err => {
            console.log('Error: ', err.message);
        });
}


app.get('/', (req, res) => {
    const printerNames = printers.map(p => p.name);

    Promise.all(printers.map(printer => {
        return getPrinterStatus(printer.endpoint)
    })).then(respArray => {

        respArray = respArray.filter(r => !!r);

        respArray.forEach((resp, index) => {
            resp.name = printerNames[index];
        });

        res.send(respArray);
    })
});


app.listen(port, () => {
    console.log(printers.length, "printers");
    console.log(`Moonbridge listening on port ${port}`);
});
