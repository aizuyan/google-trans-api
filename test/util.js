'use strict'
const expect = require('chai').expect

const sleep = require("../dist/util").sleep

describe('Test function [sleep]', () => {
  it('shoud sleep 400ms', async () => {
    let start = new Date()
    await sleep(400)
    let end = new Date()

    const result = end - start
    expect(result).to.be.least(400)
    expect(result).to.be.most(500)
  })
})
