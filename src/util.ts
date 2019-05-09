async function sleep(duration: number): Promise<undefined> {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve()
        }, duration)
    })
}

export {
    sleep
}
