const { symbols } = require('../database/symbols');
const request = require('request');
const cheerio = require('cheerio');
const fs = require('fs');

exports.symbolFilter = (searchQuery) => {
    for(var index in searchQuery) {
        var char = searchQuery[index];
        if(char != " ") {
            let isThere = symbols.includes(char);
            if(isThere) {
                searchQuery = searchQuery.replace(char, "");
            }
        }
    }
    return searchQuery;
};

exports.removeSpaces = (searchQuery) => {
    searchQuery = searchQuery.replace(/\s+/g, " ");
    return searchQuery;
}

exports.getGoogleSearchCorrection = (query, webLang) => {
    return new Promise((resolve, reject) => {
        request({
            url: `https://www.google.co.in/search?q=${query}&hl=${webLang}&lr=in`,
            headers: {
                'User-Agent': "Mozilla/5.0 (Macintosh; Intel Mac OS X 11_0_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.67 Safari/537.36"
            }
        }, (error, response, html) => {
            if (!error, response.statusCode == 200) {
                let $ = cheerio.load(html);
                fs.writeFileSync("index.html", $.html());
                let firstSpellingCheck = $('html body#gsr.srp.vasq div#main.main div#cnt.big div.mw div#rcnt.GyAeWb div.col div#center_col.eIYMdc div#taw div div.med p.gqLncc.card-section.KDCVqf a.gL9Hy b i').text();
                // console.log("FIRST "+firstSpellingCheck);
                if (firstSpellingCheck.length == 0) {
                    let secondSupposeCheck = $("html body#gsr.srp.vasq div#main.main div#cnt.big div.mw div#rcnt.GyAeWb div.col div#center_col.eIYMdc div#taw div div.med p#fprs.p64x9c.card-section.KDCVqf a#fprsl.gL9Hy b i").text();
                    // console.log("SECOND "+secondSupposeCheck);
                    if (secondSupposeCheck.length == 0) {
                        resolve(query)
                    } else {
                        resolve(secondSupposeCheck);
                    }
                } else {
                    resolve(firstSpellingCheck);
                }
            } else {
                reject(error);
            }
        });
    });

}