'use strict';
const clientFromConnectionString = require('azure-iot-device-mqtt').clientFromConnectionString;
const Message = require('azure-iot-device').Message;

// Device connection string
const connectionString = '<CENSORED>';
const client = clientFromConnectionString(connectionString);
const SerialPort = require('serialport');

let valCollection = [];
const timerInterval = 3500;
const comPort = "COM3"
const baudRate = 9600;

// for documentation, see:
// https://www.npmjs.com/package/serialport
const port = new SerialPort(comPort, {
  baudRate: baudRate
});


// Switches the port into "flowing mode"
port.on('data', function (data) {
    const sensorVal = parseInt(data);
    if(data > 200) {
        // data is probably the sensor data
        //console.log(sensorVal);
        collectData(sensorVal/1000);
    }
});

const collectData = (val) => {
    
    valCollection.push(val);
}

const printResultFor = (op) => {
    return function printResult(err, res) {
      if (err) console.log(op + ' error: ' + err.toString());
      if (res) console.log(op + ' status: ' + res.constructor.name);
    };
  }

const messageDistributor = () => {
    setTimeout(() => {
        const item = {
            time: Date.now(),
            value: calcAverage()
        }
        valCollection = [];

        messageSend(item);
        messageDistributor();
    }, timerInterval)
}

const calcAverage = () => {
    const l = valCollection.length;

    if(l === 0) {
        return;
    }
    const sum = valCollection.reduce((x, y) => x + y);
    
    return sum/l;
}

const messageSend = (item) => {
    if(item && item.time && item.value) {
        item.deviceId= 'pi3Guus';
        console.log(item);
        const data = JSON.stringify(item);
        const message = new Message(data);
        message.properties.add("messageType", "PiMessage");
        client.sendEvent(message, printResultFor('send'));
    }
}

messageDistributor();