const express = require("express");
app = express();
app.use(express.urlencoded({ extended: false }));
   
try {
    const link = require("./sources/routes/link.js");
    app.use("/link", link);

    app.listen(process.env.PORT, () => console.log(`[API] Server started on port ${process.env.PORT}`));
}
catch (err) {
    console.log(`[ERROR] ${err}`);
}