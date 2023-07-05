const express = require("express");
const db = require("../db/db.js");

const router = express.Router();
router.use(express.urlencoded({ extended: false }));

try {
    // get the request uri and redirect to its destination
    router.get('/:id', (req, res) => {
        const ipAddr = req.ip;
        const date = new Date();
        const dateTimeNow = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;

        console.log(`[INFO] ${ipAddr} requested /redirection with query ${JSON.stringify(req.params.id)} at ${dateTimeNow}`);
        if (req.params.id == "" || req.params.id == null || req.params.id == undefined || !req.params.id) {
            return location.href("https://dev.ssib.al/");
        }

        db.query("SELECT * FROM link WHERE link_code = ?", [req.params.id], (err, links) => {
            if (err) {
                console.log(err);
                return res.redirect("https://ssib.al/")
            }
            if (links.length == 0) {
                return res.redirect("https://ssib.al/")
            }
            res.redirect(links[0].link_url);
        });
    });
} catch (err) {
    console.log(`[ERROR] ${err}`);
    return res.statusCode = 500, res.json({response: 500, error: "Internal Server Error."});
}

module.exports = router;