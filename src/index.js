const Router = require('@tsndr/cloudflare-worker-router')
const router = new Router()

router.cors()

router.post('/', async (req, res) => {
    const { body } = req

    if (!body.url) {
        res.body = {
            success: false,
            error: 'No URL provided',
        }
        return
    }

    // create a regex to see if the url is valid
    const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/
    const isValid = urlRegex.test(body.url)
    if (!isValid) {
        res.body = {
            success: false,
            error: 'Invalid URL',
        }
        return
    }

    const newUrl = `https://corsthing.paintbrush.workers.dev/${body.url}`

    // Fetch the new URL, and get the HTML
    const response = await fetch(newUrl)
    const html = await response.text()

    const match = html.match(/og:video" content="(.*?)"/)

    res.body = {
        success: true,
        url: match[1],
    }
})

addEventListener('fetch', event => {
    event.respondWith(router.handle(event))
})
