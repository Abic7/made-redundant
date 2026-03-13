#!/usr/bin/env node
/**
 * ANZ AI Layoffs Scraper
 * ─────────────────────────────────────────────────────────────
 * Scrapes Australian & New Zealand news sources for the past 12 months,
 * filters for AI-related workforce reductions, classifies with Claude Haiku,
 * and outputs rows ready to paste into your Google Sheet.
 *
 * Sources:
 *   RSS  — ABC News, SMH, The Age, AFR, SmartCompany, Startup Daily,
 *           NZ Herald, Stuff NZ, RNZ Business
 *   API  — NewsAPI (ANZ domain-restricted queries)
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... NEWSAPI_KEY=abc... node anz-scraper.js
 *
 * Output:
 *   anz-layoffs-data.json   — structured JSON
 *   Console TSV             — copy-paste into Google Sheets
 */

const https = require("https");
const http  = require("http");
const fs    = require("fs");
const path  = require("path");

// ─────────────────────────────────────────────────────────────
//  CONFIG
// ─────────────────────────────────────────────────────────────
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";
const NEWSAPI_KEY       = process.env.NEWSAPI_KEY       || "";

if (!ANTHROPIC_API_KEY) { console.error("✗  Set ANTHROPIC_API_KEY env var"); process.exit(1); }
if (!NEWSAPI_KEY)       { console.warn("⚠  No NEWSAPI_KEY — RSS-only mode"); }

const ONE_YEAR_AGO = (() => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return d.toISOString().split("T")[0]; // YYYY-MM-DD
})();

const CUTOFF = new Date(ONE_YEAR_AGO);

// ─────────────────────────────────────────────────────────────
//  ANZ RSS SOURCES
// ─────────────────────────────────────────────────────────────
const RSS_SOURCES = [
  // Australia
  { name:"ABC News Business",   url:"https://www.abc.net.au/news/feed/51120/rss.xml",                  country:"Australia"   },
  { name:"SMH Business",        url:"https://www.smh.com.au/rss/business.xml",                          country:"Australia"   },
  { name:"The Age Business",    url:"https://www.theage.com.au/rss/business.xml",                       country:"Australia"   },
  { name:"AFR",                 url:"https://www.afr.com/rss/feed",                                     country:"Australia"   },
  { name:"SmartCompany",        url:"https://www.smartcompany.com.au/feed/",                            country:"Australia"   },
  { name:"Startup Daily",       url:"https://www.startupdaily.net/feed/",                               country:"Australia"   },
  { name:"9News Business",      url:"https://www.9news.com.au/rss/business",                            country:"Australia"   },
  { name:"Herald Sun Business", url:"https://www.heraldsun.com.au/business/work/rss",                   country:"Australia"   },
  // New Zealand
  { name:"NZ Herald Business",  url:"https://www.nzherald.co.nz/business/rss/",                        country:"New Zealand" },
  { name:"Stuff NZ Business",   url:"https://www.stuff.co.nz/business/rss",                            country:"New Zealand" },
  { name:"RNZ Business",        url:"https://feeds.rnz.co.nz/businessrss.xml",                         country:"New Zealand" },
];

// ─────────────────────────────────────────────────────────────
//  NEWSAPI QUERIES (domain-restricted to ANZ outlets)
// ─────────────────────────────────────────────────────────────
const ANZ_DOMAINS = [
  "afr.com","smh.com.au","theage.com.au","abc.net.au",
  "smartcompany.com.au","startupdaily.net","businessinsider.com.au",
  "nzherald.co.nz","stuff.co.nz","rnz.co.nz","newsroom.co.nz",
].join(",");

const NEWSAPI_QUERIES = [
  { q:"layoffs redundancies AI artificial intelligence jobs Australia",    domains: ANZ_DOMAINS },
  { q:"workforce reduction automation roles eliminated Australia",         domains: ANZ_DOMAINS },
  { q:"\"made redundant\" AI technology jobs Australia \"New Zealand\"",   language:"en" },
  { q:"headcount cut AI jobs Australia 2025 2026",                        domains: ANZ_DOMAINS },
];

// ─────────────────────────────────────────────────────────────
//  LAYOFF KEYWORDS
// ─────────────────────────────────────────────────────────────
const LAYOFF_KW = [
  "redund","layoff","lay off","job cut","headcount","workforce reduction",
  "retrench","restructur","roles eliminat","position eliminat","staff cut",
  "job loss","made redundant","let go","downsiz","job shed",
];

function isLayoffRelated(text) {
  const t = text.toLowerCase();
  return LAYOFF_KW.some(kw => t.includes(kw));
}

// ─────────────────────────────────────────────────────────────
//  HTTP HELPER (no external deps)
// ─────────────────────────────────────────────────────────────
function fetchURL(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith("https") ? https : http;
    const req = mod.get(url, {
      headers: { "User-Agent":"Mozilla/5.0 (compatible; ANZScraper/1.0)", ...headers },
      timeout: 12000,
    }, res => {
      // Handle redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchURL(res.headers.location, headers).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
      const chunks = [];
      res.on("data", c => chunks.push(c));
      res.on("end",  () => resolve(Buffer.concat(chunks).toString("utf8")));
      res.on("error", reject);
    });
    req.on("error",   reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("timeout")); });
  });
}

// ─────────────────────────────────────────────────────────────
//  RSS PARSER (no external deps)
// ─────────────────────────────────────────────────────────────
function parseRSS(xml) {
  const items = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = itemRe.exec(xml)) !== null) {
    const raw = m[1];
    const get = (tag) => {
      const r = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, "i");
      return (raw.match(r) || [])[1]?.trim() || "";
    };
    const pubDate = get("pubDate") || get("dc:date") || get("published");
    items.push({
      title:       get("title").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">"),
      description: get("description").replace(/<[^>]+>/g,"").replace(/&amp;/g,"&").trim(),
      pubDate,
      link:        get("link") || get("guid"),
    });
  }
  return items;
}

// ─────────────────────────────────────────────────────────────
//  FETCH FUNCTIONS
// ─────────────────────────────────────────────────────────────
async function fetchRSS(source) {
  try {
    const xml   = await fetchURL(source.url);
    const items = parseRSS(xml);
    return items
      .filter(item => {
        if (!item.title) return false;
        const pub = new Date(item.pubDate);
        return !isNaN(pub.getTime()) && pub >= CUTOFF && isLayoffRelated(item.title + " " + item.description);
      })
      .map(item => ({ ...item, sourceName: source.name, country: source.country }));
  } catch (e) {
    console.warn(`  ✗ ${source.name}: ${e.message}`);
    return [];
  }
}

async function fetchNewsAPI(query) {
  if (!NEWSAPI_KEY) return [];
  try {
    const params = new URLSearchParams({
      q:        query.q,
      from:     ONE_YEAR_AGO,
      sortBy:   "publishedAt",
      pageSize: 100,
      apiKey:   NEWSAPI_KEY,
      ...(query.domains  && { domains:  query.domains  }),
      ...(query.language && { language: query.language }),
    });
    const json = JSON.parse(await fetchURL(`https://newsapi.org/v2/everything?${params}`));
    if (!json.articles) { console.warn(`  ✗ NewsAPI: ${json.message || "no articles"}`); return []; }
    return json.articles
      .filter(a => isLayoffRelated(a.title + " " + (a.description || "")))
      .map(a => ({
        title:       a.title,
        description: a.description || "",
        pubDate:     a.publishedAt,
        link:        a.url,
        sourceName:  a.source?.name || "NewsAPI",
        country:     query.q.includes("New Zealand") ? "Australia or New Zealand" : "Australia",
      }));
  } catch (e) {
    console.warn(`  ✗ NewsAPI query "${query.q.slice(0,40)}…": ${e.message}`);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────
//  CLAUDE HAIKU CLASSIFICATION
// ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You extract structured data from news articles about corporate workforce reductions for a tracker called "Made Redundant".
Respond ONLY with a valid JSON object — no markdown, no commentary.`;

const USER_TEMPLATE = (text) => `Article:
"""
${text.slice(0, 1200)}
"""

Extract:
{
  "relevant":      true/false,
  "company":       "company name (null if unclear)",
  "industry":      "industry sector (e.g. Banking, Telecommunications, E-commerce)",
  "country":       "Australia or New Zealand",
  "date":          "YYYY-MM (month of announcement)",
  "headcount":     integer (jobs affected, 0 if unclear),
  "aiConfidence":  "genuine" | "washing" | "restructure" | "skip",
  "quote":         "direct quote about reason, max 120 chars"
}

aiConfidence:
  genuine     — AI/automation is clearly the primary cited reason
  washing     — Uses AI language but likely cost-cutting/financial in disguise
  restructure — Structural/operational change; AI is a secondary factor
  skip        — Not a workforce reduction, or unrelated to AI/technology

Set relevant=false and aiConfidence="skip" if the article is not about a workforce reduction.`;

async function classifyWithClaude(article) {
  const text = `${article.title}\n\n${article.description}`;
  const body = JSON.stringify({
    model:      "claude-haiku-4-5-20251001",
    max_tokens: 320,
    system:     SYSTEM_PROMPT,
    messages:   [{ role:"user", content: USER_TEMPLATE(text) }],
  });

  try {
    const resText = await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: "api.anthropic.com",
        path:     "/v1/messages",
        method:   "POST",
        headers:  {
          "Content-Type":      "application/json",
          "Content-Length":    Buffer.byteLength(body),
          "x-api-key":         ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        timeout: 20000,
      }, res => {
        const chunks = [];
        res.on("data", c => chunks.push(c));
        res.on("end",  () => resolve(Buffer.concat(chunks).toString("utf8")));
        res.on("error", reject);
      });
      req.on("error",   reject);
      req.on("timeout", () => { req.destroy(); reject(new Error("timeout")); });
      req.write(body);
      req.end();
    });

    const envelope = JSON.parse(resText);
    if (envelope.error) throw new Error(envelope.error.message);
    const raw = envelope.content?.[0]?.text?.trim() || "";
    return JSON.parse(raw.replace(/^```json\n?|```$/g, ""));
  } catch (e) {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
//  DEDUPLICATION
// ─────────────────────────────────────────────────────────────
function dedup(articles) {
  const seen = new Set();
  return articles.filter(a => {
    const key = a.title.toLowerCase().replace(/\W+/g, "").slice(0, 45);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─────────────────────────────────────────────────────────────
//  MAIN
// ─────────────────────────────────────────────────────────────
async function main() {
  console.log("\n🇦🇺  ANZ AI Layoffs Scraper");
  console.log(`    Period : ${ONE_YEAR_AGO} → today`);
  console.log(`    Sources: ${RSS_SOURCES.length} RSS feeds + ${NEWSAPI_QUERIES.length} NewsAPI queries\n`);

  // ── 1. Fetch ──────────────────────────────────────────────
  console.log("── Fetching RSS feeds ──────────────────────────────");
  const rssChunks = await Promise.all(RSS_SOURCES.map(async src => {
    process.stdout.write(`  ${src.name.padEnd(28)} `);
    const items = await fetchRSS(src);
    console.log(items.length ? `${items.length} articles` : "0");
    return items;
  }));

  console.log("\n── Fetching NewsAPI ────────────────────────────────");
  const apiChunks = await Promise.all(NEWSAPI_QUERIES.map(async q => {
    process.stdout.write(`  "${q.q.slice(0,42).padEnd(44)}" `);
    const items = await fetchNewsAPI(q);
    console.log(items.length ? `${items.length} articles` : "0");
    return items;
  }));

  const allArticles = dedup([...rssChunks.flat(), ...apiChunks.flat()]);
  console.log(`\nTotal after dedup : ${allArticles.length} articles\n`);

  if (allArticles.length === 0) {
    console.log("No layoff articles found. Check your keys / network.");
    return;
  }

  // ── 2. Classify ───────────────────────────────────────────
  console.log("── Classifying with Claude Haiku ───────────────────");
  const results = [];
  const skipped = [];

  for (let i = 0; i < allArticles.length; i++) {
    const a = allArticles[i];
    process.stdout.write(`  [${String(i+1).padStart(3)}/${allArticles.length}] ${a.title.slice(0,55).padEnd(56)} `);

    const c = await classifyWithClaude(a);

    if (c && c.relevant && c.aiConfidence !== "skip" && c.headcount > 0 && c.company) {
      results.push({
        company:      c.company,
        industry:     c.industry      || "Unknown",
        country:      c.country       || a.country,
        region:       "Asia-Pacific",
        date:         c.date          || "",
        headcount:    c.headcount,
        aiConfidence: c.aiConfidence,
        quote:        c.quote         || "",
        source:       a.link          || "",
        addedAt:      new Date().toISOString().split("T")[0],
      });
      console.log(`✓  ${c.company} · ${c.headcount} jobs · ${c.aiConfidence}`);
    } else {
      const reason = !c ? "parse error" : !c.relevant ? "not relevant" : c.aiConfidence === "skip" ? "skip" : c.headcount === 0 ? "no headcount" : "no company";
      skipped.push(a.title);
      console.log(`—  ${reason}`);
    }

    // Respect Haiku rate limits (~50 req/min on API tier 1)
    await new Promise(r => setTimeout(r, 350));
  }

  // ── 3. Output ─────────────────────────────────────────────
  console.log(`\n${"─".repeat(54)}`);
  console.log(`✅  ${results.length} entries classified`);
  console.log(`—   ${skipped.length} articles skipped\n`);

  if (results.length === 0) {
    console.log("No classifiable entries found this run.");
    return;
  }

  // JSON file
  const output = {
    generated: new Date().toISOString(),
    period:    `${ONE_YEAR_AGO} to ${new Date().toISOString().split("T")[0]}`,
    region:    "Asia-Pacific (Australia & New Zealand)",
    count:     results.length,
    entries:   results,
  };
  const outFile = path.join(__dirname, "anz-layoffs-data.json");
  fs.writeFileSync(outFile, JSON.stringify(output, null, 2));
  console.log(`JSON saved → ${outFile}`);

  // Google Sheets TSV
  const tsvFile = path.join(__dirname, "anz-layoffs-data.tsv");
  const header  = "company\tindustry\tcountry\tregion\tdate\theadcount\taiConfidence\tquote\tsource\taddedAt";
  const rows    = results.map(r =>
    [r.company, r.industry, r.country, r.region, r.date, r.headcount, r.aiConfidence, r.quote, r.source, r.addedAt].join("\t")
  );
  fs.writeFileSync(tsvFile, [header, ...rows].join("\n"));
  console.log(`TSV  saved → ${tsvFile}`);

  // Print TSV to console for direct copy-paste
  console.log("\n── Google Sheets (copy everything below this line) ──");
  console.log(header);
  rows.forEach(r => console.log(r));
}

main().catch(err => { console.error("\n✗  Fatal:", err.message); process.exit(1); });
