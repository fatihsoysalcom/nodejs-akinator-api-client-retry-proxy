import { fetch, ProxyAgent } from 'undici'; // undici is built-in in Node.js 18+

// --- Configuration ---
const AKINATOR_API_BASE_URL = process.env.AKINATOR_API_URL || 'https://jsonplaceholder.typicode.com';
const PROXY_URL = process.env.HTTP_PROXY || ''; // e.g., 'http://localhost:8888' or 'socks5://user:pass@host:port'

const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000; // 1 second

// --- Helper function to simulate a flaky API response ---
// In a real scenario, the actual API would return these errors.
// Here, we simulate it client-side for demonstration purposes.
function simulateFlakyResponse(attempt) {
    // Simulate a 500 Internal Server Error for the first attempt 50% of the time,
    // and for the second attempt 25% of the time.
    // This ensures retries are often triggered.
    if (attempt === 0 && Math.random() < 0.5) {
        return { status: 500, message: 'Simulated Internal Server Error' };
    }
    if (attempt === 1 && Math.random() < 0.25) {
        return { status: 502, message: 'Simulated Bad Gateway' };
    }
    return null; // No simulated error, proceed with actual fetch
}

/**
 * Makes an API request with retry and optional proxy support.
 * @param {string} path - The API endpoint path (e.g., '/questions').
 * @param {object} [options={}] - Request options.
 * @param {string} [options.method='GET'] - HTTP method.
 * @param {object} [options.headers={}] - Request headers.
 * @param {object|string} [options.body] - Request body.
 * @returns {Promise<object>} The JSON response from the API.
 * @throws {Error} If all retries fail or a non-retryable error occurs.
 */
async function callAkinatorAPI(path, options = {}) {
    const { method = 'GET', headers = {}, body } = options;
    const url = `${AKINATOR_API_BASE_URL}${path}`;

    let agent;
    if (PROXY_URL) {
        // Akinator API Geliştirmek: Proxy Desteği
        // ProxyAgent, undici kütüphanesi ile HTTP/HTTPS/SOCKS proxy'lerini destekler.
        // Ortam değişkeninden alınan PROXY_URL ile bir proxy ajanı oluşturulur.
        agent = new ProxyAgent(PROXY_URL);
        console.log(`[AkinatorClient] Using proxy: ${PROXY_URL}`);
    }

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        const backoffTime = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
        console.log(`[AkinatorClient] Attempt ${attempt + 1}/${MAX_RETRIES + 1} for ${url}`);

        // Simulate a flaky response before making the actual request
        const simulatedError = simulateFlakyResponse(attempt);
        if (simulatedError) {
            console.warn(`[AkinatorClient] Simulated error (status: ${simulatedError.status}): ${simulatedError.message}`);
            if (attempt < MAX_RETRIES) {
                // Akinator API Geliştirmek: Yeniden Deneme (Retry) Mekanizması
                // Geçici hatalarda (5xx durum kodları gibi) belirli bir gecikmeyle yeniden deneme yapılır.
                // Burada üstel geri çekilme (exponential backoff) stratejisi kullanılmıştır.
                console.log(`[AkinatorClient] Retrying in ${backoffTime}ms...`);
                await new Promise(res => setTimeout(res, backoffTime));
                continue; // Go to the next attempt
            } else {
                throw new Error(`[AkinatorClient] Failed after ${MAX_RETRIES + 1} attempts: ${simulatedError.message}`);
            }
        }

        try {
            const fetchOptions = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    ...headers,
                },
                body: body ? JSON.stringify(body) : undefined,
                dispatcher: agent, // Use the proxy agent if defined
            };

            const response = await fetch(url, fetchOptions);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[AkinatorClient] API Error: ${response.status} ${response.statusText} - ${errorText}`);

                // Akinator API Geliştirmek: Yeniden Deneme (Retry) Mekanizması
                // 5xx durum kodları genellikle geçici sunucu hatalarını gösterir ve yeniden denenebilir.
                if (response.status >= 500 && response.status < 600 && attempt < MAX_RETRIES) {
                    console.log(`[AkinatorClient] Retrying in ${backoffTime}ms...`);
                    await new Promise(res => setTimeout(res, backoffTime));
                    continue; // Go to the next attempt
                } else {
                    throw new Error(`[AkinatorClient] API request failed: ${response.status} ${response.statusText}`);
                }
            }

            // Akinator API Geliştirmek: Başarılı API Yanıtı
            // Başarılı bir yanıt durumunda, JSON verisi ayrıştırılır ve döndürülür.
            return await response.json();

        } catch (error) {
            console.error(`[AkinatorClient] Network or unexpected error: ${error.message}`);
            if (attempt < MAX_RETRIES) {
                // Akinator API Geliştirmek: Yeniden Deneme (Retry) Mekanizması
                // Ağ kesintileri gibi hatalarda da yeniden deneme yapılır.
                console.log(`[AkinatorClient] Retrying in ${backoffTime}ms...`);
                await new Promise(res => setTimeout(res, backoffTime));
            } else {
                throw new Error(`[AkinatorClient] Failed after ${MAX_RETRIES + 1} attempts: ${error.message}`);
            }
        }
    }
}

// --- Example Usage ---
async function main() {
    console.log("--- Akinator Client Example ---");
    console.log(`API Base URL: ${AKINATOR_API_BASE_URL}`);
    console.log(`Proxy URL: ${PROXY_URL || 'None'}`);
    console.log(`Max Retries: ${MAX_RETRIES}`);
    console.log("-------------------------------");

    try {
        // Simulate fetching a question
        console.log("\nFetching Akinator question (simulated)...");
        const questionResponse = await callAkinatorAPI('/posts/1', { method: 'GET' }); // Using a public API for demonstration
        console.log("Successfully fetched question:");
        console.log(questionResponse);

        // Simulate answering a question (POST request)
        console.log("\nAnswering Akinator question (simulated POST)...");
        const answerResponse = await callAkinatorAPI('/posts', {
            method: 'POST',
            body: {
                title: 'foo',
                body: 'bar',
                userId: 1,
            },
            headers: {
                'X-Akinator-Session': 'some-session-id', // Example custom header
            },
        });
        console.log("Successfully answered question:");
        console.log(answerResponse);

    } catch (error) {
        console.error("\n--- Operation Failed ---");
        console.error(error.message);
        console.error("Make sure your Node.js version is 18+ for built-in undici fetch/ProxyAgent.");
        console.error("If using a proxy, ensure it's running and accessible.");
    }
}

main();
