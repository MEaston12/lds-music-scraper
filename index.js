const cheerio = require('cheerio');
const got = require('got');
const fs = require('fs').promises;

let urlFragments = ["songs-of-the-heart","face-to-face","music-for-men","instrumental-music","music-for-women"];
//let urlFragments = ["camp-songs"];

async function main() {
    let data = {};

    for(let webZone of urlFragments) {
        let response = await got(`https://www.churchofjesuschrist.org/music/library/${webZone}`);
        const $ = cheerio.load(response.body);
        
        data[webZone] = { vocals: [], instrumentals: [] };

        let match = response.body.match(/var jsonPlaylist = (.+?});/);
        if(match[1]) {
            let jsonPlaylist = JSON.parse(match[1]);
            let arr = jsonPlaylist.playlist.list;
            arr.forEach(song => {
                if(song.url != null) data[webZone].vocals.push({name: song.name, url: song.url});
                if(song.alturl != null) data[webZone].instrumentals.push({name: song.name, url: song.alturl});
            });

            console.log(`Read ${webZone}`);
        }
    }
    

    for(let category of urlFragments) {
        try {
            await fs.access(`./${category}-instrumentals`);
            await fs.access(`./${category}-vocals`);
         } catch(e) {
            await fs.mkdir(`./${category}-instrumentals`);
            await fs.mkdir(`./${category}-vocals`);
         } 
        for(let song of data[category].instrumentals) {
            console.log(`writing ${song.name}.mp3 (${song.url})`);
            try {
                await fs.writeFile(`./${category}-instrumentals/${song.name}.mp3`,(await got(song.url,{encoding:null})).body);
            } catch(e) {
                console.log("failed!");
            }
        }
        for(let song of data[category].vocals) {
            console.log(`writing ${song.name}.mp3 (${song.url})`);
            try {
                await fs.writeFile(`./${category}-vocals/${song.name}.mp3`,(await got(song.url,{encoding:null})).body);
            } catch(e) {
                console.log("failed!");
            }
        }
    }
}

main();
