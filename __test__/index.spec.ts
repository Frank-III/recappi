import test from "ava";

import { ShareableContent } from "../index.cjs";

test("should be able to get shareable application list", (t) => {
  t.true(Array.isArray(ShareableContent.applications()));
});
