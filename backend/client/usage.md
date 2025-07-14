# Using API Types in SvelteKit or Next.js

## Option 1: openapi-client-axios (Recommended)

1. **Install in your client project:**

   ```bash
   npm install openapi-client-axios
   ```

2. **Use in your code:**

   ```ts
   import OpenAPIClientAxios from "openapi-client-axios";

   // Point to your backend's OpenAPI JSON
   const api = new OpenAPIClientAxios({
     definition: "http://localhost:3000/api-docs.json",
   });

   async function main() {
     const client = await api.init();
     // Type-safe call (auto-complete for endpoint names and params)
     const stories = await client.getStories();
     console.log(stories.data);
   }

   main();
   ```

- You get type-safe, auto-completed API calls directly from your OpenAPI spec.
- No need to manually copy type files.

---

## Option 2: Copy Generated Types

1. **Generate types in your server project:**
   ```bash
   npm run generate:types
   # This creates/updates client/client-types.ts
   ```
2. **Copy to your client project:**
3. **Import and use in your client code:**
   ```ts
   import type { paths } from "./client-types";
   ```
4. **Regenerate and copy when the API changes.**
