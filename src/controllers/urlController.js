const urlModel = require("../models/urlModel")
const shortid = require('shortid');
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
const isValidObjectId = function (objectId) {
    return mongoose.Types.ObjectId.isValid(objectId)
}


const createShortUrl = async function (req, res)  {
    try{

 const longUrl = req.body.longUrl;
    if (!isValid(longUrl)) {
        return res.status(400).send({ status: false, message: "Please provide LongURL." });
    }
    const LongUrlintoDB = await urlModel.findOne({ longUrl: longUrl }).select({_id:0,longUrl:1,shortUrl:1,urlCode:1})
    if (LongUrlintoDB) {
        return res.status(200).send({ status: true, msg: "Short URL already exists", data: LongUrlintoDB });
    }

    const baseUrl = "http://localhost:3000";

    const urlCode = shortid.generate()

    const shortUrl = baseUrl + '/' + urlCode;

    const urlShorten = await urlModel.create({ longUrl: longUrl, shortUrl: shortUrl, urlCode:urlCode });

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

        if (!isValid(urlCode)) {
            return res.status(400).send({ status: false, message: "Please enter valid urlCode" })
            }
            const findUrlCode = await urlModel.findOne({ urlCode: urlCode });
           
            if (findUrlCode) {
               
                return res.status(200).send({ status: true, msg: "longUrl", data: findUrlCode.longUrl, });
            }
            else {
                return res.status(404).send({ status: false, msg: "No url found with this urlCode" })
            }
        }
    
    catch (err) {
        console.log(err)
        return res.status(500).send({ status: true, message: err.message })
    }
}












module.exports.createShortUrl=createShortUrl
 module.exports.getUrlCode=getUrlCode

