const express = require("express");
const db = require("../../db/db.js");

const router = express.Router();
router.use(express.urlencoded({ extended: false }));

try {
    // GET /link/info
    router.get('', (req, res) => {
        const ipAddr = req.ip;
        const date = new Date();
        const dateTimeNow = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;

        console.log(`[INFO] ${ipAddr} requested /link/info with query ${JSON.stringify(req.query)} at ${dateTimeNow}`);

        db.query("SELECT * FROM link", (err, links) => {
            if (err) {
                console.log(err);
                return res.statusCode = 500, res.json({response: 500, error: "Internal Server Error."});
            }

            if (links.length == 0) {
                return res.statusCode = 404, res.json({response: 404, error: "No link found with that ID."});
            }

            if (!req.query.id && !req.query.code) {
                return res.statusCode = 400, res.json({response: 400, error: "No query parameters provided."});
            }

            if (req.query.id) {
                const result = links.filter(d => d.link_id == req.query.id);
                if (isNaN(req.query.id)) 
                return res.statusCode = 400, res.json({response: 400, error: "Invalid id query parameter."});

                if (!result.length)
                    return res.statusCode = 404, res.json({response: 404, error: "No link found with that ID."});
        
                links = result;
            }
        
            if (req.query.code) {
                const result = links.filter(d => d.link_code == req.query.code);
                if (!result.length)
                    return res.statusCode = 404, res.json({response: 404, error: "No link found with that ID."});
        
                links = result;
            }

            links.forEach((link) => {
                var creatorIp = link.creator_ip;
            // detect creator ip version and change to format below
            // ipv4 : 123.456.***.***
            // ipv6 : 1234:5678:****:****:****:****:****:****

                if (creatorIp.includes(":")) {
                    creatorIp = creatorIp.split(":");
                    creatorIp = `${creatorIp[0]}:${creatorIp[1]}:****:****:****:****:****:****`;
                }
                else if (creatorIp.includes(".")) {
                    creatorIp = creatorIp.split(".");
                    creatorIp = `${creatorIp[0]}.${creatorIp[1]}.***.***`;
                }

                link.creator_ip = creatorIp;
            });

            return res.json({item: links});
        });
    });
}
catch (err) {
    console.log(`[ERROR] ${err}`);
    return res.statusCode = 500, res.json({response: 500, error: "Internal Server Error."});
}

module.exports = router;