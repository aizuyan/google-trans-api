async function sleep(duration) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, duration);
    });
}
function log(...msgs) {
    console.log(new Date(), ...msgs);
}
export { sleep, log };
