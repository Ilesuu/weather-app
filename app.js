const yargs = require("yargs");
const axios = require("axios");
const fs = require("fs");


const argv = yargs
    .options({
        a: {
            demand: true,
            alias: "address",
            describe: "Address to fetch wheather for",
            string: true
        }
    })
    .help()
    .alias("help", "h")
    .argv;

var encodeAPIKey = (address ,apiname) => {
    return new Promise((resolve, reject) => {
        try{
            var notesString = fs.readFileSync("api_keys.json");
            var parsed = JSON.parse(notesString);
            key = parsed.filter((key) => key.title === apiname)[0].body;
            if (key) {
                resolve(`${address}${key}`)
            } else {
                throw new Error("Key not in database")
            }
        } catch (e) {
            reject(`Unable to find ${apiname} api key`)
        }
    })
}
var encodedAddress = encodeURIComponent(argv.a);
encodeAPIKey(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=`,"google").then((response) => {
    return axios.get(response);
}).then((response) => {
    if (response.data.status === "ZERO_RESULTS") {
        throw new Error("Unable to find that address.")
    }
    var lat = response.data.results[0].geometry.location.lat;
    var lng = response.data.results[0].geometry.location.lng;
    console.log(response.data.results[0].formatted_address);
    return encodeAPIKey(`http://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=`,"openweathermap")
}).then((response) => {
    return axios.get(response);
}).then((response) => {
    var temperature = response.data.main.temp - 273.15;
    var feelsLike = response.data.main.feels_like - 273.15;
    console.log(`It's currently ${temperature} degrees celcius. It feels like ${feelsLike}`);
}).catch((e) => {
    if (e.code === "ETIMEDOUT" || e.code === "ENOTFOUND") {
        console.log("unable to connect to API servers");
    } else {
        console.log(e.message);
    }
});

