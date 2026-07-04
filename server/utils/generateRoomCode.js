function generateRoomCode() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let code = "";

    for(let i=0;i<4;i++){
        code += chars[Math.floor(Math.random()*chars.length)];
    }

    return code;
}

console.log(generateRoomCode());

// eslint-disable-next-line no-undef
module.exports = generateRoomCode;