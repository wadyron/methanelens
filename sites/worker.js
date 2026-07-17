function assetRequest(request, pathname) {
  const url = new URL(request.url);
  url.pathname = pathname;
  return new Request(url, request);
}

export default {
  async fetch(request, env) {
    if (!env?.ASSETS?.fetch) {
      return new Response("Static asset binding unavailable.", { status: 503 });
    }

    const url = new URL(request.url);
    if (url.pathname === "/" || url.pathname === "/index.html") {
      return env.ASSETS.fetch(assetRequest(request, "/index.html"));
    }

    const response = await env.ASSETS.fetch(request);
    if (response.status !== 404 || url.pathname.includes(".")) return response;
    return env.ASSETS.fetch(assetRequest(request, "/404.html"));
  },
};
