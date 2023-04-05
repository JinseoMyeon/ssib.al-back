const express = require("express");
const db = require("../../db/db.js");
const isReachable = require('is-reachable');
const uuidAPIKey = require('uuid-apikey');

const router = express.Router();
router.use(express.urlencoded({ extended: false }));

try {
    // PATCH /link/update[/:origcode] (ADMIN)
    router.patch('/:origcode', (req, res) => {
        const ipAddr = req.ip;
        const date = new Date();
        const dateTimeNow = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;

        if (req.headers.auth !== process.env.ADMIN_APIKEY || uuidAPIKey.check(req.headers.auth, process.env.ADMIN_UUID) === false) {
            console.log(`[WARN] ${ipAddr} requested /link/update/${req.params.origcode} with query ${JSON.stringify(req.query)} at ${dateTimeNow} with Wrong API_KEY, '${req.headers.auth}'`);
            return res.json({response: 401, error: "Unauthorized."});
        }
        console.log(`[INFO] ${ipAddr} requested /link/update/${req.params.origcode} with query ${JSON.stringify(req.query)} at ${dateTimeNow}`);

        var url;
        var code;

        if (!req.params.origcode) {
            return res.json({response: 400, error: "No query parameters provided."});
        }
        
        if (!req.query.url && !req.query.code) {
            return res.json({response: 400, error: "No query parameters provided."});
        }

        (async () => {

            if (req.query.url) {
                var pingURL = req.query.url.replace("https://", "").replace("http://", "").replace("www.", "");
                pingURL = pingURL.split("/")[0];

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

                if (url.length == 0) {
                    return res.json({response: 400, error: "Invalid URL."});
                }
            }

            db.query("SELECT * FROM link", (err, links) => {
                if (err) {
                    console.log(err);
                    return res.json({response: 500, error: "Internal server error."});
                }
    
                if (!links.filter(d => d.code == req.params.origcode).length) {
                    return res.json({response: 404, error: "No link found with that ID."});
                }                  

                if (req.query.code && req.query.code != req.params.origcode) {
                    if (links.filter(d => d.code == req.query.code).length) {
                        return res.json({response: 409, error: "Link code already exists."});
                    }
                    code = req.query.code;
                }
                else {
                    code = req.params.origcode;
                }

                if (!req.query.url) {
                    url = links.filter(d => d.code == req.params.origcode)[0].url;
                }
    
                db.query("UPDATE link SET url = ?, code = ? WHERE code = ?", [url, code, req.params.origcode], (err) => {
                    if (err) {
                        console.log(err);
                        return res.json({response: 500, error: "Internal server error."});
                    }
                    return res.json({response: 200, message: "Link updated successfully.", info: {originalCode: req.params.origcode, url: url, code: code, created: dateTimeNow}});
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