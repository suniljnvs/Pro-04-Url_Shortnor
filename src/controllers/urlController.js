const urlModel = require("../models/urlModel")
const shortid = require('shortid');


const isValid = function (value) {
    if (typeof value === 'undefined' || value === null) return false
    if (typeof value === 'string' && value.trim().length === 0) return false
    return true;
}


const createShortUrl = async function (req, res)  {

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

    let shortUrl = baseUrl + '/' + urlCode;

    const urlShorten = await urlModel.create({ longUrl: longUrl, shortUrl: shortUrl, urlCode:urlCode });

    return res.status(201).send({ status: true, msg: "url is shorten", data: urlShorten, });
}

module.exports.createShortUrl=createShortUrl

