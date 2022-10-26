# Medal-extractor

This is a Cloudflare worker that extracts direct video links from the [Medal](https://medal.tv/) video sharing platform.

## Usage

Send a `POST` request to `https://medal.kindled.workers.dev` with the following body:

```json
{
    "url": "https://medal.tv/games/minecraft/clip/<id>"
}
```

You will then get back a response with the direct video URL:

```json
{
    "success": true,
    "url": "https://cdn.medal.tv/source/xxxxxxxx/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.mp4"
}
```
