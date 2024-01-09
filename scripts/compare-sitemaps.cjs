fs = require('fs');
var parser = require('xml2json');
const FgRed = "\x1b[31m"
const FgGreen = "\x1b[32m"



if (process.argv.length === 3) {
    console.error('Expected at least two arguments!');
    process.exit(1);
}
const futureSitemap = parser.toJson(fs.readFileSync(process.argv[2]));
const currentSitemap = parser.toJson(fs.readFileSync(process.argv[3]));

function notTagOrCategory(url) {
    return !(url.includes("/tags/") || url.includes("/category/") || url.includes("/categories/"))
}
console.success = (message) => {
    console.log('%c ' + message, 'color: green; font-weight:bold')
}

const futureSitemapUrls = new Set(JSON.parse(futureSitemap)["urlset"]["url"]
    .map(urlloc => urlloc["loc"])
    .filter(notTagOrCategory))

const currentSitemapUrls = new Set(JSON.parse(currentSitemap)["urlset"]["url"]
    .map(urlloc => urlloc["loc"])
    .filter(notTagOrCategory))

for (const currentSitemapUrl of currentSitemapUrls) {
    if (futureSitemapUrls.has(currentSitemapUrl)) {
        console.log(FgGreen, currentSitemapUrl);
    } else {
        console.log(FgRed, currentSitemapUrl);
    }
}