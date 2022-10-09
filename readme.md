A CLI version of Netflix FAST.COM (Unofficial).

![file](https://user-images.githubusercontent.com/15277233/194745619-8d25c518-96b7-4195-8213-d7f6810afdfe.svg)

## Usage

```shell
npx fast.com@latest
```

## How does it works?

1. Send a GET request to `https://fast.com/`
2. Parse the document using `cheerio`
3. Query the `script` tag and get its `src`
4. Fetch the script content
5. Parse the script with `acorn`
6. Find the `token` using `acorn-walk`
7. Send requests to `https://api.fast.com/netflix/speedtest/v2?https=true&token=${token}&urlCount=5` to get the request object urls.
8. Send all requests at once.
9. Benchmark using `stream.on('data')`.