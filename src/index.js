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

    // need to check for medal in the regex later
    const urlRegex = /^(https?:\/\/)?medal.tv\/games\/.*\/clips?\/.*$/
    const isValid = urlRegex.test(body.url) && body.url.includes('medal.tv')
    if (!isValid) {
        res.body = {
            success: false,
            error: 'Invalid URL',
        }
        return
    }

    // fixes links
    const url = body.url.replace(/clips\/(.*?)\/.*/, 'clip/$1')

    const newUrl = `https://corsthing.paintbrush.workers.dev/${url}`

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
