const urlModel = require("../models/urlModel")
const shortid = require('shortid');
const validUrl = require('valid-url')
const redis = require("redis");
const { promisify } = require("util");


// Connect to redis
const redisClient = redis.createClient(
    11084,
    "redis-11084.c264.ap-south-1-1.ec2.cloud.redislabs.com",
    { no_ready_check: true }
);
redisClient.auth("PMxAl8ifXJwbABuMKPPUhJhNjTPf8XbX", function (err) {
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

//===============================< create url/shorten >===============================================

const createShortUrl = async function (req, res) {
    try {

        const longUrl = req.body.longUrl;

        //Check req.body  is empty or not....
        if (!isValid(longUrl)) {
            return res.status(400).send({ status: false, message: "Please provide LongURL." });
        }
        // Check validation for given long Url...
        if (!(validUrl.isWebUri(longUrl))) {
            return res.status(400).send({ status: false, message: "Url is not valid" });
        }

        const cachedLongUrl = await GET_ASYNC(`${longUrl}`)

        if (cachedLongUrl) {
            return res.status(200).send({ status: true, data: cachedLongUrl })
        }
        const longUrlIntoDB = await urlModel.findOne({ longUrl: longUrl }).select({ _id: 0, longUrl: 1, shortUrl: 1, urlCode: 1 })
        
        // Set the documents in cache memory........
        if (longUrlIntoDB) {
            await SET_ASYNC(`${longUrl}`, JSON.stringify(longUrlIntoDB))
            return res.status(200).send({ status: true, msg: "Short URL already exists", data: longUrlIntoDB });
        }

        const baseUrl = "http://localhost:3000";

        // Generate Url code .....
        const urlCode = shortid.generate()

        const shortUrl = baseUrl + '/' + urlCode;
        const urlData = { longUrl, shortUrl, urlCode };

        // Create the Url code .....
        const newUrl = await urlModel.create(urlData)

        return res.status(201).send({ status: true, msg: "url is shorten", data: newUrl, });
    }
    catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}




//=================================< GET /:urlCode >=============================================


const getUrlCode = async function (req, res) {
    try {
        const urlCode = req.params.urlCode

        //finding data in cache memory
        const cachedUrlCode = await GET_ASYNC(`${urlCode}`) 
        const data = JSON.parse(cachedUrlCode)

        if (data) {
            res.status(307).redirect(data.longUrl)
        }
        //finding the urlCode in urlModel
        else {
            const findUrlCode = await urlModel.findOne({ urlCode: urlCode }); 
            
            if (findUrlCode) {
                res.status(307).redirect(findUrlCode.longUrl)
            }
            else {
                return res.status(404).send({ status: false, msg: "No Documents found with this urlCode" })
            }
        
        }
    }
    catch (err) {
        console.log(err)
        return res.status(500).send({ status: true, message: err.message })
    }
}


module.exports.createShortUrl = createShortUrl
module.exports.getUrlCode = getUrlCode










