const Router = require('@tsndr/cloudflare-worker-router')
const router = new Router()

router.cors()


router.post('/', handleRequest)

// simple function to get the highest quality video embed
function getHighestQuality(clipData) {
    const types = [1080, 720, 480, 360, 240, 144]
    for (const type of types) {
        if (clipData[`contentUrl${type}p`]) {
            return clipData[`contentUrl${type}p`]
        }
    }
    return clipData.socialMediaVideo
}

// move route to a function, as I need to recall it if the request fails
async function handleRequest(req, res) {
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

    const buildPath = await KEYS.get("pBuild") ?? "zjTnnG61Ze5UKZs2YM16f-"
    // convert links into format that is used by medal's clip data api
    const url = body.url.replace('medal.tv', `medal.tv/_next/data/${buildPath}/en`).replace("/clip/", "/clips/").replace(/(\?.*)/, "") + ".json"
    // Create a variable with the Medal URL, and my CORS proxy.
    const newUrl = `https://corsthing.paintbrush.workers.dev/${url}`
    // fetch the response of the page, and get the HTML
    const response = await fetch(newUrl)
    if(response.status === 404) {
        try{
            const data = await response.json()
            if(data.notFound) {
                res.body = {
                    success: false,
                    error: 'Clip not found',
                }
                return
            } else throw new Error("Unknown error")
        } catch(e) {
            if(Number(await KEYS.get("errors")) > 5) {
                res.body = {
                    success: false,
                    error: 'Medal changed something, please report this to the developer',
                }
                return
            }
            console.log("attempting to gather new build...")
            const text = await (await fetch("https://medal.tv")).text()
            const newCode=text.match(/\/_next\/static\/([\w\d]+)\/_ssgManifest/)[1]
            console.log("new build code:", newCode)
            await KEYS.put("pBuild",newCode)
            await KEYS.put("errors", String(Number(await KEYS.get("errors")) + 1))
            return handleRequest(req, res)
        }
    }
    const data = await response.json()
    const clipData = data.pageProps.clip
    //fetch the highest quality video embed.
    const directURL = getHighestQuality(clipData) ?? "Couldn't find a video URL"
    // send it back to the user
    KEYS.put("errors", "0")
    res.body = {
        success: true,
        url: directURL
    }
}

addEventListener('fetch', event => {
    event.respondWith(router.handle(event.request))
})
