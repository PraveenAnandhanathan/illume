# illume

**A web front end for Elasticsearch — forked from [mobz/elasticsearch-head](https://github.com/mobz/elasticsearch-head) with Elasticsearch 8.x compatibility fixes.**

---

## What's different in this fork

The upstream `elasticsearch-head` project is largely unmaintained and **broken on Elasticsearch 7.x+ and completely non-functional on Elasticsearch 8.x** for the Browser / Structured Query table view (zero columns displayed).

This fork fixes that.

### Fixes included

| Issue | Root cause | Fix |
|---|---|---|
| **Table view shows no columns on ES8** | ES8 removed mapping types — `properties` is now directly under `mappings` instead of under a `_doc` type wrapper. The old code iterated `"properties"` as if it were a type name, then tried `mappings["properties"].properties` which is `undefined`, so no fields were ever registered. | `metaData.js`: detect typeless mappings and wrap under a synthetic `_doc` key so all downstream path lookups work correctly. |
| **Field values not populated in table rows** | ES8 no longer returns `_type` on search hits. The doc-path (`dpath`) was constructed as `index.undefined.field` and never matched any registered metadata path. | `queryDataSourceInterface.js` / `resultDataSourceInterface.js`: fall back to `"_doc"` when `hit._type` is absent. |

Both fixes are backward-compatible with ES 6 and 7.

---

## Running

### With the built-in server

```bash
git clone https://github.com/PraveenAnandhanathan/illume.git
cd illume
npm install
npm run start
```

Open [http://localhost:9100/](http://localhost:9100/)

### With Docker

```bash
# Build from this fork
docker build -t illume .
docker run -p 9100:9100 illume
```

Open [http://localhost:9100/](http://localhost:9100/)

### As a Chrome extension

Install [ElasticSearch Head](https://chrome.google.com/webstore/detail/elasticsearch-head/ffmkiejjmecolpfloofpjologoblkegm/) from the Chrome Web Store and click the extension icon. No CORS configuration required.

---

## Connecting to Elasticsearch

By default Elasticsearch exposes its REST API on port 9200, which illume connects to.

### Enable CORS in Elasticsearch (required unless using the Chrome extension)

Add the following to your `elasticsearch.yml`:

```yaml
http.cors.enabled: true
http.cors.allow-origin: "*"
```

For ES8 with security enabled, also add:

```yaml
http.cors.allow-headers: Authorization, X-Requested-With, Content-Type, Content-Length
```

### ES8 security (TLS + authentication)

ES8 ships with security on by default. Open illume with credentials in the URL:

```
http://localhost:9100/?auth_user=elastic&auth_password=changeme
```

You will also need `http.cors.allow-headers: Authorization` in `elasticsearch.yml`.

### URL parameters

| Parameter | Description |
|---|---|
| `base_uri` | Force illume to connect to a specific node, e.g. `?base_uri=http://node-01.example.com:9200` |
| `auth_user` | Basic auth username |
| `auth_password` | Basic auth password |
| `dashboard` | Open in dashboard mode, e.g. `?dashboard=cluster` |
| `lang` | Force UI language (`en`, `fr`, `pt`, `zh`, `zh-TW`, `tr`, `ja`, `vi`) |

---

## Contributing

You will need: `git`, `node` (with `npm`), and `grunt-cli`.

```bash
git clone https://github.com/PraveenAnandhanathan/illume.git
cd illume
npm install
grunt dev
```

Changes to both `_site` and `src` directories must be committed.

---

## Upstream / Attribution

This project is a fork of [mobz/elasticsearch-head](https://github.com/mobz/elasticsearch-head), originally by [Ben Birch (@mobz)](https://twitter.com/mobz). All original work and license terms remain intact. This fork adds Elasticsearch 8.x compatibility fixes on top of the original.

---

## Screenshots

![ClusterOverview Screenshot](http://mobz.github.com/elasticsearch-head/screenshots/clusterOverview.png)
