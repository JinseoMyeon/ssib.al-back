const express = require("express");
const db = require("../db/db.js");

const router = express.Router();
router.use(express.urlencoded({ extended: false }));

try {
    // GET /link
    router.get('', (req, res) => {
        const ipAddr = req.ip;
        const date = new Date();
        const dateTimeNow = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;

        console.log(`[INFO] ${ipAddr} requested /link with query ${JSON.stringify(req.query)} at ${dateTimeNow}`);
        db.query("SELECT * FROM link", (err, links) => {
            if (err) {
                console.log(err);
                return res.json({response: 500, error: "Internal server error."});
            }
            return res.json({count: links.length, items: links});
        });
    });

    // GET /link/info
    const info = require('./link/info.js');
    router.use('/info', info);

    // GET /link/search
    const search = require('./link/search.js');
    router.use('/search', search);

    // POST /link/create
    const create = require('./link/create.js');
    router.use('/create', create);

    // PATCH /link/update
    const update = require('./link/update.js');
    router.use('/update', update);

    // DELETE /link/remove
    const remove = require('./link/remove.js');
    router.use('/remove', remove);

}
catch(err) {
    console.log(`[ERROR] ${err}`);
    return res.json({ response: 500, error: "Internal server error." });
}

module.exports = router;