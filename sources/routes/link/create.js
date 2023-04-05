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
                return res.json({response: 400, error: "No query parameters provided."});
            }
    
            var pingURL = req.query.url.replace("https://", "").replace("http://", "").replace("www.", "");
            pingURL = pingURL.split("/")[0];
    
            (async () => {
                const prohibitQueryResult = await new Promise((resolve, reject) => {
                    db.query(`SELECT * FROM link_censored WHERE url LIKE '%${pingURL}%'`, (err, links) => {
                        if (err) {
                            console.log(err);
                            return res.json({ response: 500, error: "Internal server error." });
                        }
                        resolve(links);
                    });
                });
    
                if (prohibitQueryResult.length) {
                    return res.json({response: 400, error: "This URL is prohibited to shorten."});
                }
    
                const httpsResult = await isReachable(`${pingURL}:443`);
                const httpResult = await isReachable(`${pingURL}:80`);
    
                if (req.query.url.includes("https://")) {
                    if (httpsResult)
                        url = req.query.url;
                    else 
                        return res.json({response: 400, error: "Ping request failed for requested URL."});
                }
    
                else if (req.query.url.includes("http://")) {
                    if (httpResult)
                        url = req.query.url;
                    else
                        return res.json({response: 400, error: "Ping request failed for requested URL."});
                }
    
                else {
                    if (httpsResult) {
                        url = "https://" + req.query.url;
                    }
    
                    else if (httpResult) {
                        url = "http://" + req.query.url;
                    }
                    
                    else {
                        return res.json({response: 400, error: "Ping request failed for requested URL."});
                    }
                }
    
            if (!req.query.code) {
                var random = Math.floor((Math.random() * (2176782335 - 46656)) + 46656);
                var code = random.toString(36);
                console.log(code)
            }
            else {
                var code = req.query.code;
            }
    
            if (url.length == 0) {
                return res.json({response: 400, error: "Invalid URL."});
            }
    
            db.query("SELECT * FROM link", (err, links) => {
                if (err) {
                    console.log(err);
                    return res.json({response: 500, error: "Internal server error."});
                }
    
                if (links.filter(d => d.code == req.query.code).length) {
                    return res.json({response: 409, error: "Link code already exists."});
                }
        
                db.query("INSERT INTO link (url, code, created) VALUES (?, ?, ?)", [url, code, dateTimeNow], (err) => {
                    if (err) {
                        console.log(err);
                        return res.json({response: 500, error: "Internal server error."});
                    }
                    return res.json({response: 200, message: "Link created successfully.", info: {url: url, code: code, created: dateTimeNow}});
                });
            });
    
        })();
        
        });
}
catch (err) {
    console.log(`[ERROR] ${err}`);
    return res.json({ response: 500, error: "Internal server error." });
}

module.exports = router;