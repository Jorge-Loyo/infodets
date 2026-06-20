"""
Webhook server para auto-deploy desde GitHub.
Escucha en puerto 9000 y ejecuta deploy.sh cuando recibe push a main.
"""
import hashlib
import hmac
import json
import subprocess
from http.server import HTTPServer, BaseHTTPRequestHandler

SECRET = "infodets-deploy-secret-2024"
DEPLOY_SCRIPT = "/home/infodets/deploy.sh"


class WebhookHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path != "/webhook":
            self.send_response(404)
            self.end_headers()
            return

        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length)

        # Verificar firma de GitHub
        signature = self.headers.get("X-Hub-Signature-256", "")
        expected = "sha256=" + hmac.new(
            SECRET.encode(), body, hashlib.sha256
        ).hexdigest()

        if not hmac.compare_digest(signature, expected):
            self.send_response(403)
            self.end_headers()
            self.wfile.write(b"Invalid signature")
            return

        # Verificar que es push a main
        payload = json.loads(body)
        ref = payload.get("ref", "")

        if ref == "refs/heads/main":
            subprocess.Popen(["/bin/bash", DEPLOY_SCRIPT])
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"Deploy triggered")
        else:
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"Ignored (not main)")

    def log_message(self, format, *args):
        pass  # Silenciar logs HTTP


if __name__ == "__main__":
    server = HTTPServer(("0.0.0.0", 9000), WebhookHandler)
    print("Webhook server listening on port 9000...")
    server.serve_forever()
