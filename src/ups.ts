import * as puppeteer from 'puppeteer'

const pupOptions = { args: ['--no-sandbox', '--disable-setuid-sandbox'] }


const ups = async (trackingNumber: string): Promise<string> => {
  const browser = await puppeteer.launch(pupOptions)
  const page = await browser.newPage()
  await page.goto(`https://www.ups.com/mobile/track?loc=en_GB&trackingNumber=${trackingNumber}&t=t`)

  const progress = await page.$$eval('.package-progress ul li', (lis: any) => {
    const removeTags = (str: string) => str.replace(/<\/*[a-zA-Z]*>/g, ``)
    const trackLines = lis.map((el: HTMLElement) => removeTags(el.innerHTML))
    const [location, date, action] = trackLines
    return `${location}\n${date}\n${action}`
  })

  await browser.close()

  return progress
}

export default ups
