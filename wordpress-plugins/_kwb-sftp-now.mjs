import SftpClient from "ssh2-sftp-client";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { posix } from "path";
import { buildPluginZip } from "./deploy/lib/build-zip.js";
import { collectPluginFiles } from "./deploy/lib/deploy-zip.js";

const dir = dirname(fileURLToPath(import.meta.url));
const pluginDir = join(dir, "neo-pulse-wp");
const zipPath = join(dir, "neo-pulse-wp.zip");
const remoteRoot = "wp-content/plugins/neo-pulse-wp";

import { readFileSync } from "fs";

const config = JSON.parse(
  readFileSync(new URL("./deploy/sites/kwb.json", import.meta.url), "utf8")
);
const password = process.env.KWB_SFTP_PASSWORD || "";
if (!password) {
  console.error("Set KWB_SFTP_PASSWORD before running.");
  process.exit(1);
}
const site = {
  host: config.host,
  port: config.port || 2222,
  username: config.username,
  password,
};

buildPluginZip(pluginDir, zipPath);
const { files, dirs } = collectPluginFiles(pluginDir);

const sftp = new SftpClient();
await sftp.connect({
  ...site,
  readyTimeout: 120000,
  retries: 3,
  retry_factor: 2,
  retry_minTimeout: 5000,
  family: 4,
  algorithms: {
    serverHostKey: ["ssh-rsa", "rsa-sha2-512", "rsa-sha2-256", "ssh-ed25519"],
    kex: [
      "curve25519-sha256",
      "curve25519-sha256@libssh.org",
      "ecdh-sha2-nistp256",
      "diffie-hellman-group14-sha256",
      "diffie-hellman-group-exchange-sha256",
    ],
    cipher: ["aes128-ctr", "aes256-ctr", "aes128-gcm@openssh.com", "aes256-gcm@openssh.com"],
  },
});

await sftp.mkdir(remoteRoot, true);
for (const d of [...dirs].sort((a, b) => a.length - b.length)) {
  await sftp.mkdir(posix.join(remoteRoot, d), true);
}

let n = 0;
for (const f of files) {
  await sftp.fastPut(f.local, posix.join(remoteRoot, f.rel));
  n += 1;
  if (n % 40 === 0 || n === files.length) {
    console.log(`UPLOAD ${n}/${files.length}`);
  }
}

await sftp.end();
console.log("SFTP_DEPLOY_OK", n, "files");
