# Nodejs Akinator API Client Retry Proxy

This example demonstrates a robust Node.js client for interacting with an external API, featuring retry logic with exponential backoff and optional proxy support. It simulates an Akinator-like API interaction, showing how to handle transient network errors or server issues by retrying requests and how to route requests through a proxy using Node.js 18+'s built-in `undici` module.

## Language

`javascript`

## How to Run

1. Ensure you have Node.js version 18 or higher installed.
2. Run the script: `node akinatorClient.js`
3. To test with a proxy, set the `HTTP_PROXY` environment variable (e.g., `HTTP_PROXY=http://localhost:8888 node akinatorClient.js`).

## Original Article

This example accompanies the Turkish article: [2026 Yılında Akinator API Geliştirmek: TypeScript, Retry ve Proxy Destekli Bir Yaklaşım](https://fatihsoysal.com/blog/2026-yilinda-akinator-api-gelistirmek-typescript-retry-ve-proxy-destekli-bir-yaklasim/).

## License

MIT — see [LICENSE](LICENSE).
