const yargs = require("yargs");
const axios = require("axios");
const fs = require("fs");

// app command info
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
/**
 * Promise function for fetching api key from api-keys.json, and appending it to the end of a url
 * @param {string} address address to which api key is appended
 * @param {string} apiname api title in api-keys.json
 */
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

//Encode address for geolocation api search
var encodedAddress = encodeURIComponent(argv.a);
encodeAPIKey(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=`,"google").then((response) => {
    //Fetch geolocation data
    return axios.get(response);
}).then((response) => {
    //Encode address for weather api search
    if (response.data.status === "ZERO_RESULTS") {
        throw new Error("Unable to find that address.")
    }
    var lat = response.data.results[0].geometry.location.lat;
    var lng = response.data.results[0].geometry.location.lng;
    console.log(response.data.results[0].formatted_address);
    return encodeAPIKey(`http://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=`,"openweathermap")
}).then((response) => {
    //Fetch weather data
    return axios.get(response);
}).then((response) => {
    //Process and print results
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

