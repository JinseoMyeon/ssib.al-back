const express = require("express");
const db = require("../../db/db.js");
const isReachable = require('is-reachable');
const uuidAPIKey = require('uuid-apikey');

const router = express.Router();
router.use(express.urlencoded({ extended: false }));

try {
    // PATCH /link/update[/:originalcode] (ADMIN)
    router.patch('/:originalcode', (req, res) => {
        const ipAddr = req.ip;
        const date = new Date();
        const dateTimeNow = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;

        if (req.headers.auth !== process.env.ADMIN_APIKEY || uuidAPIKey.check(req.headers.auth, process.env.ADMIN_UUID) === false) {
            console.log(`[WARN] ${ipAddr} requested /link/update/${req.params.originalcode} with query ${JSON.stringify(req.query)} at ${dateTimeNow} with Wrong API_KEY, '${req.headers.auth}'`);
            return res.json({response: 401, error: "Unauthorized."});
        }
        console.log(`[INFO] ${ipAddr} requested /link/update/${req.params.originalcode} with query ${JSON.stringify(req.query)} at ${dateTimeNow}`);

        var url;
        var code;

        if (!req.params.originalcode) {
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
                    db.query(`SELECT * FROM link_prohibit WHERE prohibit_url LIKE '%${pingURL}%'`, (err, links) => {
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
    
                if (!links.filter(d => d.link_code == req.params.originalcode).length) {
                    return res.json({response: 404, error: "No link found with that ID."});
                }                  

                if (req.query.code && req.query.code != req.params.originalcode) {
                    if (links.filter(d => d.link_code == req.query.code).length) {
                        return res.json({response: 409, error: "Link code already exists."});
                    }
                    code = req.query.code;
                }
                else {
                    code = req.params.originalcode;
                }

                if (!req.query.url) {
                    url = links.filter(d => d.link_code == req.params.originalcode)[0].link_url;
                }

                modifiedCounts = links.filter(d => d.link_code == req.params.originalcode)[0].modified_count + 1;
    
                db.query("UPDATE link SET link_url = ?, link_code = ?, modified_count = ?, modified_datetime = ? WHERE link_code = ?", [url, code, modifiedCounts, dateTimeNow, req.params.originalcode], (err) => {
                    if (err) {
                        console.log(err);
                        return res.json({response: 500, error: "Internal server error."});
                    }
                    return res.json({response: 200, message: "Link updated successfully.", info: {originalCode: req.params.originalcode, link_url: url, link_code: code, modified_count: modifiedCounts, modified_datetime: dateTimeNow}});
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