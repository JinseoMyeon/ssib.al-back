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
                return res.json({response: 500, error: "Internal server error."});
            }

            if (links.length == 0) {
                return res.json({response: 404, error: "No links found."});
            }

            if (!req.query.id && !req.query.code) {
                return res.json({response: 400, error: "No query parameters provided."});
            }

            if (req.query.id) {
                const result = links.filter(d => d.link_id == req.query.id);
                if (isNaN(req.query.id)) 
                    return res.json({response: 400, error: "Invalid id query parameter."});

                if (!result.length)
                    return res.json({response: 404, error: "No link found with that ID."});
        
                links = result;
            }
        
            if (req.query.code) {
                const result = links.filter(d => d.link_code == req.query.code);
                if (!result.length)
                    return res.json({response: 404, error: "No link found with that ID."})
        
                links = result;
            }

            return res.json({item: links});
        });
    });
}
catch (err) {
    console.log(`[ERROR] ${err}`);
    return res.json({ response: 500, error: "Internal server error." });
}

module.exports = router;