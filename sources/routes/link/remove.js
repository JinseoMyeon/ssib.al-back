const express = require("express");
const db = require("../../db/db.js");
const uuidAPIKey = require('uuid-apikey');

const router = express.Router();
router.use(express.urlencoded({ extended: false }));

try {
    router.delete('', ((req, res) => {
        const ipAddr = req.ip;
        const date = new Date();
        const dateTimeNow = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;

        if (req.headers.auth !== process.env.ADMIN_APIKEY || uuidAPIKey.check(req.headers.auth, process.env.ADMIN_UUID) === false) {
            console.log(`[WARN] ${ipAddr} requested /link/remove with query ${JSON.stringify(req.query)} at ${dateTimeNow} with Wrong API_KEY, '${req.headers.auth}'`);
            return res.statusCode = 401, res.json({response: 401, error: "Unauthorized."});
        }
        console.log(`[INFO] ${ipAddr} requested /link/remove with query ${JSON.stringify(req.query)} at ${dateTimeNow}`);

        if (!req.query.code && !req.query.id) {
            return res.statusCode = 400, res.json({response: 400, error: "No query parameters provided."});
        }

        if (!req.query.id) {
            req.query.id = 0;
        }

        db.query(`SELECT * FROM link WHERE link_code = '${req.query.code}' OR link_id = ?`, [req.query.id], (err, result) => {
            if (err) {
                console.log(err);
                return res.statusCode = 500, res.json({ response: 500, error: "Internal server error." });
            }
            if (result.length === 0) {
                return res.statusCode = 404, res.json({ response: 404, error: "No such link found." });
            }
            if (result.length > 1) {
                return res.statusCode = 409, res.json({ response: 409, error: "Multiple links found." });
            }

            db.query(`DELETE FROM link WHERE link_code = '${req.query.code}' OR link_id = ?`, [req.query.id], (err, result) => {
                if (err) {
                    console.log(err);
                    return res.statusCode = 500, res.json({ response: 500, error: "Internal server error." });
                }
                return res.statusCode = 200, res.json({ response: 200, message: "Successfully deleted." });
            });
        });
    }))
} catch (err) {
    console.log(`[ERROR] ${err}`);
    return res.statusCode = 500, res.json({ response: 500, error: "Internal server error." });
}

module.exports = router;