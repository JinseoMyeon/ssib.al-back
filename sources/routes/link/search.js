const express = require("express");
const db = require("../../db/db.js");

const router = express.Router();
router.use(express.urlencoded({ extended: false }));

try {
        // GET /link/search
        router.get('', (req, res) => {
            const ipAddr = req.ip;
            const date = new Date();
            const dateTimeNow = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;

            console.log(`[INFO] ${ipAddr} requested /link/search with query ${JSON.stringify(req.query)} at ${dateTimeNow}`);
    
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
}
catch (err) {
    console.log(`[ERROR] ${err}`);
    return res.json({ response: 500, error: "Internal server error." });
}

module.exports = router;