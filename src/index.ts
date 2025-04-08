import { chromium } from 'playwright';
import { BrowserContext } from "playwright-core";

const TARGET_URL = 'https://vestle.tartunlp.ai/'; // Replace with your target
const REQUESTS_PER_SECOND = 5; // Change to control RPS
const DURATION_SECONDS = 60; // Duration of the test

const responseTimes: number[] = [];

const runSingleRequest = async (
    id: number,
    context: BrowserContext
) => {
    const page = await context.newPage();

    try {
        const start = Date.now();
        await page.goto(TARGET_URL);
        const input = await page.waitForSelector("textarea", { timeout: 5000 });
        await input.fill('Mida sa tead veebilehe koormuse testimisest?');
        console.log(`Request ${id}: Typed into textarea`);
 //       const send = await page.waitForSelector("#send_button", { timeout: 5000 });
 //       await send.click();
 //       await page.waitForSelector("#selection_buttons_row", { timeout: 30000 });
        const end = Date.now();

        const duration = end - start;
        responseTimes.push(duration);

        console.log(`Request ${id}: ${duration} ms`);
    } catch (error) {
        console.error(`Request ${id}: Error`, error);
    } finally {
        await page.close();
    }
};

const startLoadTest = async () => {
    const browser = await chromium.launch();
    const context = browser.newContext();

    let totalRequests = 0;
    const interval = 1000 / REQUESTS_PER_SECOND;
    const maxRequests = REQUESTS_PER_SECOND * DURATION_SECONDS;

    const intervalId = setInterval(async () => {
        if (totalRequests >= maxRequests) {
            clearInterval(intervalId);
            setTimeout(async () => {
                await browser.close();
                const average =
                    responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
                console.log(
                    `\nLoad test complete.\nTotal requests: ${responseTimes.length}\nAverage response time: ${average.toFixed(
                        2
                    )} ms`
                );
            }, 1000); // wait for final requests to finish
            return;
        }

        runSingleRequest(totalRequests + 1, await context);
        totalRequests++;
    }, interval);
};

startLoadTest().catch((err) => {
    console.error('Error running load test:', err);
});
