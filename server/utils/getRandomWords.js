const words = require("../words")

function getRandomWords(count = 3){
    const shuffled = [...words].sort(() => Math.random() -0.5);
    return shuffled.slice(0,count);
}

module.exports = getRandomWords;