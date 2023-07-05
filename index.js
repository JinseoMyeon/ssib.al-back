const express = require("express");
const cors = require("cors");
app = express();
app.use(express.urlencoded({ extended: false }));
app.set('trust proxy', true);

const date = new Date();
const dateTimeNow = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;

let corsOptions = {
    origin: 'https://dev.ssib.al',
    credentials: true
};

try {
    const link = require("./sources/routes/link.js");
    app.use(cors(corsOptions));
    app.use("/link", link);

    const redirection = require("./sources/routes/redirection.js");
    app.use("/redirection", redirection);

    /* const linkInfo = require("./sources/routes/link/info.js");
    app.use("/link/info", linkInfo);

    const linkSearch = require("./sources/routes/link/search.js");
    app.use("/link/search", linkSearch);

    const linkCreate = require("./sources/routes/link/create.js");
    app.use("/link/create", linkCreate);

    const linkUpdate = require("./sources/routes/link/update.js");
    app.use("/link/update", linkUpdate); */

    //const linkDelete = require("./sources/routes/link/delete.js");
    //app.use("/link/delete", linkDelete);

    app.listen(process.env.PORT, '0.0.0.0', () => console.log(`[API] Server started on port ${process.env.PORT} at ${dateTimeNow}`));
}
catch (err) {
    console.log(`[ERROR] ${err}`);
}