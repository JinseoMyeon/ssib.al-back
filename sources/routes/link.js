const express = require("express");
const db = require("../db/db.js");
const isReachable = require('is-reachable');

const router = express.Router();

const urlRegex = /(http(s)?:\/\/)?(www\.)?[-a-z0-9가-힣@:%._\+~#=]{1,}\.[-a-z가-힣]{2,}([-a-z0-9가-힣@:%_\+.~#()?&//=]*)/gi;

const date = new Date();
const dateTimeNow = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours() + 9}:${date.getMinutes()}:${date.getSeconds()}`;

try {
    // GET /link
    router.get('', (req, res) => {
        const ipAddr = req.ip;
        console.log(`[INFO] ${ipAddr} requested /link with query ${JSON.stringify(req.query)} at ${datetime}`);
        db.query("SELECT * FROM link", (err, links) => {
            if (err) {
                console.log(err);
                return res.json({response: 500, error: "Internal server error."});
            }
            return res.json({count: links.length, items: links});
        });
    });

    // GET /link/info
    router.get('/info', (req, res) => {
        const ipAddr = req.ip;
        const datetime = new Date().toLocaleString();
        console.log(`[INFO] ${ipAddr} requested /link/info with query ${JSON.stringify(req.query)} at ${datetime}`);

        db.query("SELECT * FROM link", (err, links) => {
            if (err) {
                console.log(err);
                return res.json({response: 500, error: "Internal server error."});
            }

            if (links.length == 0) {
                return res.json({response: 404, error: "No links found."});
            }

            if (!req.query.id && !req.query.code) {
                return res.json({response: 400, error: "No query parameters provided."});
            }

            if (req.query.id) {
                const result = links.filter(d => d.id == req.query.id);
                if (isNaN(req.query.id)) 
                    return res.json({response: 400, error: "Invalid id query parameter."});

                if (!result.length)
                    return res.json({response: 404, error: "No link found with that ID."});
        
                links = result;
            }
        
            if (req.query.code) {
                const result = links.filter(d => d.code == req.query.code);
                if (!result.length)
                    return res.json({response: 404, error: "No link found with that ID."})
        
                links = result;
            }

            return res.json({item: links});
        });
    });

    // GET /link/search
    router.get('/search', (req, res) => {
        const ipAddr = req.ip;
        console.log(`[INFO] ${ipAddr} requested /link/search with query ${JSON.stringify(req.query)} at ${datetime}`);

        req.query.point = Number(req.query.point);
        req.query.number = Number(req.query.number);

        db.query("SELECT * FROM link", (err, links) => {
            if (err) {
                console.log(err);
                return res.json({response: 500, error: "Internal server error."});
            }

            // 출력할 링크가 없을 경우 404 반환

            if (links.length == 0) {
                return res.json({response: 404, error: "No links found."});
            }

            if (!req.query.url && !req.query.code && !req.query.point && !req.query.sort && !req.query.number) {
                return res.json({response: 400, error: "No query parameters provided."});
            }

            // 커스텀 코드로 링크 검색
        
            if (req.query.code) {
                const result = links.filter(d => d.code.includes(req.query.code));
                if (!result.length)
                    return res.json({response: 404, error: "No link found with that ID."})
        
                links = result;
            }

            // URL로 링크 검색
        
            if (req.query.url) {
                const result = links.filter(d => d.url.includes(req.query.url));
                if (!result.length)
                    return res.json({response: 404, error: "No link found with that ID."})
        
                links = result;
            }

            // 정렬

            if (req.query.sort == "asc") {
                links.sort((a, b) => a.id - b.id);
            }
            else if (req.query.sort == "desc") {
                links.sort((a, b) => b.id - a.id);
            }
            else if (req.query.sort) {
                return res.json({response: 400, error: "Invalid sort query parameter."});
            }

            // 시작 위치

            if (req.query.point) {
                if (!isNaN(req.query.point) && req.query.point < links.length)
                    links = links.slice(req.query.point, links.length);
                else
                    return res.json({response: 400, error: "Invalid point query parameter."});
            }

            if (req.query.number && !isNaN(req.query.number)) {
                if (req.query.point + req.query.number < links.length) {
                    if (!req.query.point || !isNaN(req.query.point))
                        links = links.slice(0, req.query.number);
                    else
                        links = links.slice(req.query.point, req.query.point + req.query.number);
                }
                else 
                    return res.json({response: 400, error: "Invalid number query parameter."})
            }

            return res.json({count: links.length, items: links});
        });
    });

    // POST /link/create
    router.post('/create', (req, res) => {
        const ipAddr = req.ip;
        let url = "";

        console.log(`[INFO] ${ipAddr} requested /link/create with query ${JSON.stringify(req.query)} at ${dateTimeNow}`);

        if (!req.query.url) {
            return res.json({response: 400, error: "No query parameters provided."});
        }

        var pingURL = req.query.url.replace("https://", "").replace("http://", "").replace("www.", "");
        pingURL = pingURL.split("/")[0];

        (async () => {
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

catch(err) {
    console.log(`[ERROR] ${err}`);
}

module.exports = router;