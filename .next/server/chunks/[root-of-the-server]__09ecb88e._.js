module.exports = {

"[externals]/next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js"));

module.exports = mod;
}}),
"[externals]/crypto [external] (crypto, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}}),
"[project]/pages/api/trf2/eproc.ts [api] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>handler)
});
var __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/crypto [external] (crypto, cjs)");
;
// Store active Puppeteer sessions in memory
const sessions = new Map();
async function loadPuppeteer() {
    // Lazy import so build does not fail when dependency is missing
    const puppeteer = await __turbopack_context__.r("[externals]/puppeteer [external] (puppeteer, esm_import, async loader)")(__turbopack_context__.i);
    return puppeteer;
}
/**
 * Initialize a scraping session and return captcha image.
 * GET ?numeroProcesso=0000000
 */ async function handleGet(req, res) {
    const numero = req.query.numeroProcesso;
    if (!numero) {
        return res.status(400).json({
            error: 'Missing numeroProcesso'
        });
    }
    const puppeteer = await loadPuppeteer();
    const browser = await puppeteer.launch({
        headless: 'new'
    });
    const page = await browser.newPage();
    // Custom user-agent helps avoid blocks
    await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
    // Navigate to the search page
    await page.goto('https://eproc-consulta.trf2.jus.br/eproc/externo_controlador.php?acao=processo_consulta_publica');
    // Fill in process number - selector may change, adjust if needed
    await page.type('input[name="numero"]', numero);
    // Captcha image element
    const captchaSelector = '#captcha-img';
    await page.waitForSelector(captchaSelector, {
        timeout: 10000
    });
    const captchaElem = await page.$(captchaSelector);
    if (!captchaElem) {
        await browser.close();
        return res.status(500).json({
            error: 'Captcha not found'
        });
    }
    // Screenshot the captcha to send in base64
    const captcha = await captchaElem.screenshot({
        encoding: 'base64'
    });
    const token = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["randomUUID"])();
    sessions.set(token, {
        browser,
        page
    });
    return res.status(200).json({
        captcha,
        token
    });
}
/**
 * Submit captcha and extract data.
 * Body: { numeroProcesso, captcha, token }
 */ async function handlePost(req, res) {
    const { numeroProcesso, captcha, token } = req.body || {};
    if (!numeroProcesso || !captcha || !token) {
        return res.status(400).json({
            error: 'Missing parameters'
        });
    }
    const session = sessions.get(token);
    if (!session) {
        return res.status(400).json({
            error: 'Invalid session'
        });
    }
    const { browser, page } = session;
    try {
        // Fill captcha - selector may change
        await page.type('input[name="captcha"]', captcha);
        await Promise.all([
            page.waitForNavigation(),
            page.click('button[type="submit"]')
        ]);
        // Wait for table with events - adjust selector if the site changes
        await page.waitForSelector('#tabelaEventos tbody tr');
        const data = await page.evaluate(()=>{
            const rows = Array.from(document.querySelectorAll('#tabelaEventos tbody tr'));
            const events = rows.slice(0, 2).map((row)=>{
                const columns = row.querySelectorAll('td');
                const data = columns[0]?.textContent?.trim() || '';
                const descricao = columns[1]?.textContent?.trim() || '';
                return {
                    data,
                    descricao
                };
            });
            // Basic information about the process
            const classe = document.querySelector('#classe')?.innerText || '';
            const assunto = document.querySelector('#assunto')?.innerText || '';
            const vara = document.querySelector('#vara')?.innerText || '';
            return {
                events,
                info: {
                    classe,
                    assunto,
                    vara
                }
            };
        });
        sessions.delete(token);
        await browser.close();
        // Summarize with GPT
        const prompt = 'Explique de forma clara e simples para um usuário leigo os dois últimos eventos deste processo judicial: ' + JSON.stringify(data.events);
        const chatRes = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ''}`
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 200
            })
        });
        if (!chatRes.ok) {
            const text = await chatRes.text();
            return res.status(chatRes.status).send(text);
        }
        const chatData = await chatRes.json();
        const resumo = chatData.choices?.[0]?.message?.content || '';
        return res.status(200).json({
            ...data,
            resumo
        });
    } catch (err) {
        console.error(err);
        await browser.close();
        sessions.delete(token);
        return res.status(500).json({
            error: 'Consulta falhou'
        });
    }
}
async function handler(req, res) {
    if (req.method === 'GET') {
        return handleGet(req, res);
    }
    if (req.method === 'POST') {
        return handlePost(req, res);
    }
    res.setHeader('Allow', [
        'GET',
        'POST'
    ]);
    return res.status(405).end('Method Not Allowed');
}
}}),
"[project]/node_modules/next/dist/esm/server/route-modules/pages-api/module.compiled.js [api] (ecmascript)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
if ("TURBOPACK compile-time falsy", 0) {
    "TURBOPACK unreachable";
} else {
    if ("TURBOPACK compile-time truthy", 1) {
        if ("TURBOPACK compile-time truthy", 1) {
            module.exports = __turbopack_context__.r("[externals]/next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js, cjs)");
        } else {
            "TURBOPACK unreachable";
        }
    } else {
        "TURBOPACK unreachable";
    }
} //# sourceMappingURL=module.compiled.js.map
}}),
"[project]/node_modules/next/dist/esm/server/route-kind.js [api] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "RouteKind": (()=>RouteKind)
});
var RouteKind = /*#__PURE__*/ function(RouteKind) {
    /**
   * `PAGES` represents all the React pages that are under `pages/`.
   */ RouteKind["PAGES"] = "PAGES";
    /**
   * `PAGES_API` represents all the API routes under `pages/api/`.
   */ RouteKind["PAGES_API"] = "PAGES_API";
    /**
   * `APP_PAGE` represents all the React pages that are under `app/` with the
   * filename of `page.{j,t}s{,x}`.
   */ RouteKind["APP_PAGE"] = "APP_PAGE";
    /**
   * `APP_ROUTE` represents all the API routes and metadata routes that are under `app/` with the
   * filename of `route.{j,t}s{,x}`.
   */ RouteKind["APP_ROUTE"] = "APP_ROUTE";
    /**
   * `IMAGE` represents all the images that are generated by `next/image`.
   */ RouteKind["IMAGE"] = "IMAGE";
    return RouteKind;
}({}); //# sourceMappingURL=route-kind.js.map
}}),
"[project]/node_modules/next/dist/esm/build/templates/helpers.js [api] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/**
 * Hoists a name from a module or promised module.
 *
 * @param module the module to hoist the name from
 * @param name the name to hoist
 * @returns the value on the module (or promised module)
 */ __turbopack_context__.s({
    "hoist": (()=>hoist)
});
function hoist(module, name) {
    // If the name is available in the module, return it.
    if (name in module) {
        return module[name];
    }
    // If a property called `then` exists, assume it's a promise and
    // return a promise that resolves to the name.
    if ('then' in module && typeof module.then === 'function') {
        return module.then((mod)=>hoist(mod, name));
    }
    // If we're trying to hoise the default export, and the module is a function,
    // return the module itself.
    if (typeof module === 'function' && name === 'default') {
        return module;
    }
    // Otherwise, return undefined.
    return undefined;
} //# sourceMappingURL=helpers.js.map
}}),
"[project]/node_modules/next/dist/esm/build/templates/pages-api.js { INNER_PAGE => \"[project]/pages/api/trf2/eproc.ts [api] (ecmascript)\" } [api] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "config": (()=>config),
    "default": (()=>__TURBOPACK__default__export__),
    "routeModule": (()=>routeModule)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$route$2d$modules$2f$pages$2d$api$2f$module$2e$compiled$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/esm/server/route-modules/pages-api/module.compiled.js [api] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$route$2d$kind$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/esm/server/route-kind.js [api] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$build$2f$templates$2f$helpers$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/esm/build/templates/helpers.js [api] (ecmascript)");
// Import the userland code.
var __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$api$2f$trf2$2f$eproc$2e$ts__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pages/api/trf2/eproc.ts [api] (ecmascript)");
;
;
;
;
const __TURBOPACK__default__export__ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$build$2f$templates$2f$helpers$2e$js__$5b$api$5d$__$28$ecmascript$29$__["hoist"])(__TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$api$2f$trf2$2f$eproc$2e$ts__$5b$api$5d$__$28$ecmascript$29$__, 'default');
const config = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$build$2f$templates$2f$helpers$2e$js__$5b$api$5d$__$28$ecmascript$29$__["hoist"])(__TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$api$2f$trf2$2f$eproc$2e$ts__$5b$api$5d$__$28$ecmascript$29$__, 'config');
const routeModule = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$route$2d$modules$2f$pages$2d$api$2f$module$2e$compiled$2e$js__$5b$api$5d$__$28$ecmascript$29$__["PagesAPIRouteModule"]({
    definition: {
        kind: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$route$2d$kind$2e$js__$5b$api$5d$__$28$ecmascript$29$__["RouteKind"].PAGES_API,
        page: "/api/trf2/eproc",
        pathname: "/api/trf2/eproc",
        // The following aren't used in production.
        bundlePath: '',
        filename: ''
    },
    userland: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$api$2f$trf2$2f$eproc$2e$ts__$5b$api$5d$__$28$ecmascript$29$__
}); //# sourceMappingURL=pages-api.js.map
}}),

};

//# sourceMappingURL=%5Broot-of-the-server%5D__09ecb88e._.js.map