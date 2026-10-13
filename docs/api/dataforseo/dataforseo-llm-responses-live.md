---
title: "Llm Responses Live"
slug: dataforseo/llm-responses-live
section: DataForSEO
method: POST
path: /api/dataforseo/llm-responses-live
auth: open
order: 120
---

POST `/api/dataforseo/llm-responses-live`.

Runs the llm responses live action in the DataForSEO API from a JSON request body.

## Request

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| _(optional)_ | object | no | JSON body shape depends on the action. |

## Response

| Field | Type | Description |
| --- | --- | --- |
| `success` / `ok` | boolean | Operation status when present |
| `error` | string | Error message on failure |

## Errors

| Status | error | Cause |
| --- | --- | --- |
| 4xx/5xx | varies | See HTTP status and `error` field in body. |

## Example

```bash
curl -X POST "https://neodigital.ca/api/dataforseo/llm-responses-live" \
  -H "Content-Type: application/json" \
  -d '{}'
```

```javascript
const res = await fetch(`/api/dataforseo/llm-responses-live`, {
  method: "POST",
  credentials: "include",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({}),
});
const data = await res.json();
```
