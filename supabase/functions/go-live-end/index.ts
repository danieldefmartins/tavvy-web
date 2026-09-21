import { handleOnTheGo } from "../_shared/onthego-lifecycle.ts";
Deno.serve((req: Request) => handleOnTheGo(req, "end"));
