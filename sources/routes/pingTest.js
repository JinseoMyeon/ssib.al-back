var tcp = require('tcp-ping');

var pingURL = "https://디미고급식.com".replace("https://", "").replace("http://", "");
pingURL = pingURL.split("/")[0];

console.log(pingURL);

tcp.probe(pingURL, 443, (err, available) => {
    if (err)
        console.log(err);
    else
        console.log(available);
});