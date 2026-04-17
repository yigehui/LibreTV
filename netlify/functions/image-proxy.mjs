import fetch from 'node-fetch';

export const handler = async (event) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': '*',
    };

    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 204,
            headers: {
                ...corsHeaders,
                'Access-Control-Max-Age': '86400',
            },
            body: '',
        };
    }

    const params = new URLSearchParams(event.queryStringParameters || {});
    const targetUrl = params.get('url') || '';
    if (!targetUrl || !/^https?:\/\//i.test(targetUrl)) {
        return {
            statusCode: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify({ error: 'Invalid url parameter' }),
        };
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
            return {
                statusCode: upstream.status || 502,
                headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' },
                body: JSON.stringify({ error: `Upstream ${upstream.status}` }),
            };
        }

        const contentType = upstream.headers.get('content-type') || 'image/jpeg';
        const arrayBuffer = await upstream.arrayBuffer();
        const base64Body = Buffer.from(arrayBuffer).toString('base64');

        return {
            statusCode: 200,
            isBase64Encoded: true,
            headers: {
                ...corsHeaders,
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=2592000, s-maxage=2592000',
            },
            body: base64Body,
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify({ error: 'Failed to fetch image' }),
        };
    }
};
