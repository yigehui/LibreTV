export async function onRequest(context) {
    const { request } = context;
    const reqUrl = new URL(request.url);
    const targetUrl = reqUrl.searchParams.get('url') || '';

    if (!targetUrl || !/^https?:\/\//i.test(targetUrl)) {
        return new Response(JSON.stringify({ error: 'Invalid url parameter' }), {
            status: 400,
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': '*',
            },
        });
    }

    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': '*',
                'Access-Control-Max-Age': '86400',
            },
        });
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

        if (!upstream.ok || !upstream.body) {
            return new Response(JSON.stringify({ error: `Upstream ${upstream.status}` }), {
                status: upstream.status || 502,
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    'Access-Control-Allow-Origin': '*',
                },
            });
        }

        const headers = new Headers();
        const contentType = upstream.headers.get('content-type') || 'image/jpeg';
        headers.set('Content-Type', contentType);
        headers.set('Cache-Control', 'public, max-age=2592000, s-maxage=2592000');
        headers.set('Access-Control-Allow-Origin', '*');

        return new Response(upstream.body, { status: 200, headers });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to fetch image' }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Access-Control-Allow-Origin': '*',
            },
        });
    }
}
