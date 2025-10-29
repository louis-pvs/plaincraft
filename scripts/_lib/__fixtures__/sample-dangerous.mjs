/**
 * sample-dangerous.mjs
 * @since 2025-10-28
 * @version 0.1.0
 * Script with dangerous patterns
 */

import { exec } from "node:child_process";

// Dangerous patterns
const _token = process.env.API_TOKEN;
exec("sudo rm -rf /tmp/test");
eval("console.log('dangerous')");
