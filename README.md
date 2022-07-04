## Description

Compares the performance of `redis` 3.1.2 and 4.2.0.

## Running

```
npm install
npm start
```

### Options
| Option    | Values                                                                                    |
|-----------|-------------------------------------------------------------------------------------------|
| test-name | The name of a test from `data/tests.json` or `@all` to run all tests. Defaults to `@all`. |
| runs      | The number of times to run through all tests. Defaults to 5.                              |
| count     | The number of times to run each test.  Defaults to 10000.                                 |