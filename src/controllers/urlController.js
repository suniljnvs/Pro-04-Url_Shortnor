const urlModel = require("../models/urlModel")
const shortid = require('shortid');
const validUrl = require('valid-url')
const redis = require("redis");
const { promisify } = require("util");


// Connect to redis
const redisClient = redis.createClient(
    13190,
    "redis-13190.c301.ap-south-1-1.ec2.cloud.redislabs.com",
    { no_ready_check: true }
);
redisClient.auth("gkiOIPkytPI3ADi14jHMSWkZEo2J5TDG", function (err) {
    if (err) throw err;
});

redisClient.on("connect", async function () {
    console.log("Connected to Redis..");
});

//Connection setup for redis------------------

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);


const isValid = function (value) {
    if (typeof value === 'undefined' || value === null) return false
    if (typeof value === 'string' && value.trim().length === 0) return false
    return true;
}



const createShortUrl = async function (req, res) {
    try {

        const longUrl = req.body.longUrl;
        if (!isValid(longUrl)) {
            return res.status(400).send({ status: false, message: "Please provide LongURL." });
        }
        if (!(validUrl.isWebUri(longUrl))) {
            return res.status(400).send({ status: false, message: "Url is not valid" });
        }

        const cachedLongUrl = await GET_ASYNC(`${longUrl}`)
        if (cachedLongUrl) {
            return res.status(200).send({ status: true, data: cachedLongUrl })
        }



        const longUrlIntoDB = await urlModel.findOne({ longUrl: longUrl }).select({ _id: 0, longUrl: 1, shortUrl: 1, urlCode: 1 })
        if (longUrlIntoDB) {
            await SET_ASYNC(`${longUrl}`, JSON.stringify(longUrlIntoDB))
            return res.status(200).send({ status: true, msg: "Short URL already exists", data: longUrlIntoDB });
        }

        const baseUrl = "http://localhost:3000";

        const urlCode = shortid.generate()

        const shortUrl = baseUrl + '/' + urlCode;
        const urlData = { longUrl, shortUrl, urlCode };

        const newUrl = await urlModel.create(urlData)

        const urlShorten = {
            urlCode: newUrl.urlCode,
            longUrl: newUrl.longUrl,
            shortUrl: newUrl.shortUrl
        }


        return res.status(201).send({ status: true, msg: "url is shorten", data: urlShorten, });
    }
    catch (error) {
        console.log(error)
        return res.status(500).send({ status: false, msg: error.message })
    }
}







const getUrlCode = async function (req, res) {
    try {
        const urlCode = req.params.urlCode

        const cachedUrlCode = await GET_ASYNC(`${urlCode}`)
        const data = JSON.parse(cachedUrlCode)

        if (data) {

            res.status(307).redirect(data.longUrl)

        }
        else {

            const findUrlCode = await urlModel.findOne({ urlCode: urlCode });


            if (!findUrlCode) {

                return res.status(404).send({ status: false, msg: "No url found with this urlCode" })

            }
            await SET_ASYNC(`${urlCode}`, JSON.stringify(findUrlCode))
            return res.status(307).redirect(findUrlCode.longUrl)

        }
    }

    catch (err) {
        console.log(err)
        return res.status(500).send({ status: true, message: err.message })
    }
}


module.exports.createShortUrl = createShortUrl
module.exports.getUrlCode = getUrlCode










