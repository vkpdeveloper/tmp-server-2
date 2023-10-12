const cheerio = require('cheerio');
const request = require("request");

function getGoogleSearchCorrection(query, webLang) {
    return new Promise((resolve, reject) => {
        request({
            url: `https://www.google.co.in/search?q=${query}&oq=${query}&hl=${webLang}`,
            headers: {
                'User-Agent': "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:82.0) Gecko/20100101 Firefox/82.0"
            }
        }, (error, response, html) => {
            if (!error, response.statusCode == 200) {
                let $ = cheerio.load(html);
                let firstSpellingCheck = $('html body#gsr.srp.vasq div#main.main div#cnt div.mw div#rcnt.GyAeWb div.col div#center_col.eIYMdc div#taw div div.med p.gqLncc.card-section.KDCVqf a.gL9Hy').text();
                if (firstSpellingCheck.length == 0) {
                    let secondSupposeCheck = $("html body#gsr.srp.vasq div#main.main div#cnt div.mw div#rcnt.GyAeWb div.col div#center_col.eIYMdc div#taw div div.med p#fprs.p64x9c.card-section.KDCVqf a#fprsl.gL9Hy").text();
                    if (secondSupposeCheck.length == 0) {
                        resolve(query)
                    } else {
                        resolve(secondSupposeCheck);
                    }
                } else {
                    resolve(query);
                }
            } else {
                reject(error);
            }
        });
    });
}

const tryToFetch = async () => {
    let result = await getGoogleSearchCorrection("aaloo", "hi");
    // console.log(result)
}

tryToFetch();

// https://www.google.co.in/search?q=potata&oq=potata&hl=hi