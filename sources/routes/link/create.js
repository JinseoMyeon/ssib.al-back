const express = require("express");
const db = require("../../db/db.js");
const isReachable = require('is-reachable');

const router = express.Router();
router.use(express.urlencoded({ extended: false }));

try {
        // POST /link/create
        router.post('', (req, res) => {
            const ipAddr = req.ip;
            const date = new Date();
            const dateTimeNow = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
            let url = "";
    
            console.log(`[INFO] ${ipAddr} requested /link/create with query ${JSON.stringify(req.query)} at ${dateTimeNow}`);
    
            if (!req.query.url) {
                return res.statusCode = 400, res.json({response: 400, error: "No query parameters provided."});
            }
    
            var pingURL = req.query.url.replace("https://", "").replace("http://", "").replace("www.", "");
            pingURL = pingURL.split("/")[0];
    
            (async () => {
                const prohibitQueryResult = await new Promise((resolve, reject) => {
                    db.query(`SELECT * FROM link_prohibited WHERE prohibit_url LIKE '%${pingURL}%'`, (err, links) => {
                        if (err) {
                            console.log(err);
                            return res.statusCode = 500, res.json({response: 500, error: "Internal Server Error."});
                        }
                        resolve(links);
                    });
                });
    
                if (prohibitQueryResult.length) {
                    const prohibitCount = prohibitQueryResult[0].used_count + 1;
                    db.query("UPDATE link_prohibited SET used_count = ? WHERE prohibit_url = ?", [prohibitCount, pingURL], (err, result) => {
                        if (err) {
                            console.log(err);
                            return res.statusCode = 500, res.json({response: 500, error: "Internal Server Error."});
                        }
                    });
                    return res.statusCode = 405, res.json({response: 405, error: "This URL is not allowed to shorten."});
                }
    
                const httpsResult = await isReachable(`${pingURL}:443`);
                const httpResult = await isReachable(`${pingURL}:80`);
    
                if (req.query.url.includes("https://")) {
                    if (httpsResult)
                        url = req.query.url;
                    else 
                        return res.statusCode = 406, res.json({response: 406, error: "Requested URL does not request, or is not reachable."});
                }
    
                else if (req.query.url.includes("http://")) {
                    if (httpResult)
                        url = req.query.url;
                    else
                        return res.statusCode = 406, res.json({response: 406, error: "Requested URL does not request, or is not reachable."});
                }
    
                else {
                    if (httpsResult) {
                        url = "https://" + req.query.url;
                    }
    
                    else if (httpResult) {
                        url = "http://" + req.query.url;
                    }
                    
                    else {
                        return res.statusCode = 406, res.json({response: 406, error: "Requested URL does not request, or is not reachable."});
                    }
                }
    
            if (!req.query.code) {
                var random = Math.floor((Math.random() * (2176782335 - 46656)) + 46656);
                var code = random.toString(36);
            }
            else {
                var code = req.query.code;
            }
    
            if (url.length == 0) {
                return res.statusCode = 406, res.json({response: 406, error: "Requested URL does not request, or is not reachable."});
            }
    
            db.query("SELECT * FROM link", (err, links) => {
                if (err) {
                    console.log(err);
                    return res.statusCode = 500, res.json({response: 500, error: "Internal Server Error."});
                }
    
                if (links.filter(d => d.link_code == req.query.code).length) {
                    return res.statusCode = 409, res.json({response: 409, error: "Requested code is already in use."});
                }
        
                db.query("INSERT INTO link (link_url, link_code, link_datetime, creator_ip) VALUES (?, ?, ?, ?)", [url, code, dateTimeNow, ipAddr], (err) => {
                    if (err) {
                        console.log(err);
                        return res.statusCode = 500, res.json({response: 500, error: "Internal Server Error."});
                    }
                    return res.statusCode = 201, res.json({response: 201, message: "Link created successfully.", info: {link_url: url, link_code: code, link_datetime: dateTimeNow, creator_ip: ipAddr}});
                });
            });
    
        })();
        
        });
}
catch (err) {
    console.log(`[ERROR] ${err}`);
    return res.statusCode = 500, res.json({response: 500, error: "Internal Server Error."});
}

module.exports = router;