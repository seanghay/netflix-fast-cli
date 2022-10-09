#!/usr/bin/env node
import { load } from 'cheerio'
import axios from 'axios'
import { parse } from 'acorn';
import { simple } from 'acorn-walk'
import { performance } from 'node:perf_hooks'
import ms from 'ms'
import chalk from 'chalk'
import clear from 'console-clear';

async function parseToken(scriptPath) {
  const { data: script } = await axios.get(scriptPath, { responseType: 'text' });
  const result = parse(script, {
    allowHashBang: true,
    ecmaVersion: 2022
  });

  return new Promise((resolve) => {
    let token = null;
    simple(result, {
      Property(node) {
        if (token != null) return;
        if (node.key.name === "token") {
          token = node.value.value;
        }
      },
    });
    resolve(token)
  })
}



clear(true)
console.log(chalk.red.bold("FAST.COM"))
console.log(chalk.green('Fetch script'));
const { data } = await axios.get("https://fast.com/", { responseType: 'text' });
const $ = load(data);
const token = await parseToken(new URL($("script[src]").first().attr('src'), "https://fast.com/"));

clear(true)
console.log(chalk.red.bold("FAST.COM"))
console.log(chalk.green('Parse token'));
const { data: { client: _client, targets } } = await axios.get(`https://api.fast.com/netflix/speedtest/v2?https=true&token=${token}&urlCount=5`);

let bytes = 0;
const avg = [];

const controller = new AbortController();

let startedAt = Date.now();
let elapsed = Date.now();

const responseTimeSamples = [];



const spinner = '◐◓◑◒'.split('')
let tick = 0;

let lastReport = {};

await Promise.all(
  targets.map(async ({ url }) => {
    try {
      const { data: stream } = await axios.get(url, { responseType: 'stream', signal: controller.signal });
      let responseTime = performance.now();
  
      stream.on('data', buffer => {
  
        bytes += buffer.length;
  
        responseTime = performance.now() - responseTime;
        responseTimeSamples.push(responseTime)
        responseTime = performance.now()
  
        if (Date.now() - startedAt > 100) {
          tick++;
          avg.push(bytes * 8 * 10);
          const averageBits = avg.reduce((a, b) => a + b, 0) / avg.length;
          const latency = ms(Math.round(responseTimeSamples.reduce((a, b) => a + b) / responseTimeSamples.length), { long: true })
          const spin = offset => chalk.dim(`${spinner[(tick + offset) % spinner.length]}`);
          clear(true)
  
          const timeElapsed = ms(Date.now() - elapsed);
  
          console.log(chalk.red.bold("FAST.COM"))
          console.log(spin(2) + chalk.yellow(' Elapsed\t') + timeElapsed);
          console.log(spin(3) + chalk.yellow(' Latency\t') + latency);
          console.log(spin(4) + chalk.yellow(' Avg. Speed\t') + Math.round(averageBits / 1000000) + " Mbps ");
          
          lastReport = {
            averageBits,
            latency,
            timeElapsed
          }
  
          bytes = 0;
          startedAt += 100;
        }
      });
      stream.on('end', () => {
        controller.abort();
        const {timeElapsed, latency, averageBits}  = lastReport;
        const spin = () => chalk.green("✔");
        clear(true)
        console.log(chalk.red.bold("FAST.COM"))
        console.log(spin(2) + chalk.green(' Elapsed\t') + timeElapsed);
        console.log(spin(3) + chalk.green(' Latency\t') + latency);
        console.log(spin(4) + chalk.green(' Avg. Speed\t') + Math.round(averageBits / 1000000) + " Mbps ");
        console.log('')
        console.log(chalk.green.bold('Your internet speed is ' + Math.round(averageBits / 1000000) + " Mbps "))
        console.log('')
      })
    } catch(e) {
      if (!axios.isAxiosError(e)) {
        throw e;
      }
    }
  })
)

