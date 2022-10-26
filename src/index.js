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

    // url regex by https://github.com/Cryogenetics
    const urlRegex = /^(https?:\/\/)?medal.tv\/games\/.*\/clips?(\/[\w\d-_]+){1,2}$/
    const isValid = urlRegex.test(body.url);
    if (!isValid) {
        res.body = {
            success: false,
            error: 'Invalid URL',
        }
        return
    }

    // fixes links
    const url = body.url.replace(/clips\/(.*?)\/.*/, 'clip/$1')

    // Create a variable with the Medal URL, and my CORS proxy.
    const newUrl = `https://corsthing.paintbrush.workers.dev/${url}`

    // fetch the response of the page, and get the HTML
    const response = await fetch(newUrl)
    const html = await response.text()

    // regex to match the video tag
    const match = html.match(/og:video" content="(.*?)"/)

    // send it back to the user
    res.body = {
        success: true,
        url: match[1],
    }
})

addEventListener('fetch', event => {
    event.respondWith(router.handle(event))
})
