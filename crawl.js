const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');


async function getImages(url, maxDepth, currentDepth = 0) {

    const results = [];
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    $('img').each(function (i, img) {

        const imageUrl = $(img).attr('src');
        results.push({
            imageUrl,
            sourceUrl: url,
            depth: currentDepth
        });
    });
    

    const linksResultsPromises = []; 
    if (currentDepth < maxDepth) { 
        const links = $('a');

        links.each(async function (i, linkElement) {

            let link = $(linkElement).attr('href');

            if (link.charAt(0) !== '#' && !link.startsWith('javascript:') && i < 10) {
                if (!link.startsWith('http')) {
                    link = new URL(link, (new URL(url)).origin).href
                }

                linksResultsPromises.push(getImages(link, maxDepth, currentDepth + 1));
            }
        });
    }
    const linksResults = await Promise.all(linksResultsPromises);
    results.push(...linksResults.flat())
    return results;
}


async function crawl(url, depth) {
    const results = await getImages(url, depth);
    fs.writeFileSync('results.json', JSON.stringify({ results }, undefined, 2));
    console.log(`Crawling completed! Results saved to results.json`);
}


const [, , url, depth] = process.argv;


crawl(url, parseInt(depth));