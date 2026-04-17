import fetch from 'node-fetch';

export default async function handler(req, res) {
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', '*');
        res.status(204).end();
        return;
    }

    const targetUrl = (req.query && req.query.url) ? String(req.query.url) : '';
    if (!targetUrl || !/^https?:\/\//i.test(targetUrl)) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.status(400).json({ error: 'Invalid url parameter' });
        return;
    }

    try {
        const upstream = await fetch(targetUrl, {
            redirect: 'follow',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Referer': 'https://movie.douban.com/',
                'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
            },
        });

        if (!upstream.ok) {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.status(upstream.status || 502).json({ error: `Upstream ${upstream.status}` });
            return;
        }

        const contentType = upstream.headers.get('content-type') || 'image/jpeg';
        const buffer = Buffer.from(await upstream.arrayBuffer());

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=2592000, s-maxage=2592000');
        res.status(200).send(buffer);
    } catch (error) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.status(500).json({ error: 'Failed to fetch image' });
    }
}
