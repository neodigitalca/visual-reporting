import os
import sys

try:
    import paramiko
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "paramiko", "-q"])
    import paramiko

HOST = "kwbllp.sftp.wpengine.com"
PORT = 2222
USER = "kwbllp-NEOPULSE"
PASS = "SFTPUSER1234"
LOCAL = r"B:\Neo Pulse\wordpress-plugins\neo-pulse-wp"
REMOTE = "wp-content/plugins/neo-pulse-wp"

transport = paramiko.Transport((HOST, PORT))
transport.connect(username=USER, password=PASS)
sftp = paramiko.SFTPClient.from_transport(transport)
print("CONNECTED")

skip = {"tests", ".git", "node_modules", ".env"}


def should_skip(rel):
    parts = rel.replace("\\", "/").split("/")
    if parts[0] in skip or any(p in skip for p in parts):
        return True
    if rel.endswith(".md") and "/" not in rel.replace("\\", "/"):
        return True
    return False


n = 0
for root, dirs, files in os.walk(LOCAL):
    dirs[:] = [d for d in dirs if d not in skip]
    for name in files:
        local = os.path.join(root, name)
        rel = os.path.relpath(local, LOCAL).replace("\\", "/")
        if should_skip(rel):
            continue
        remote = REMOTE + "/" + rel
        remote_dir = os.path.dirname(remote).replace("\\", "/")
        parts = remote_dir.split("/")
        for i in range(2, len(parts) + 1):
            p = "/".join(parts[:i])
            try:
                sftp.stat(p)
            except OSError:
                sftp.mkdir(p)
        sftp.put(local, remote)
        n += 1
        if n % 40 == 0:
            print("UPLOAD", n)

print("SFTP_DEPLOY_OK", n)
sftp.close()
transport.close()
