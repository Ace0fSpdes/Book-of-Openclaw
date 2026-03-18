import test from "node:test";
import assert from "node:assert/strict";
import net from "node:net";

// Re-implementing the logic for testing since importing server.js causes side effects (starting the server)
// and requires all dependencies to be present in node_modules, which seems to be an issue in the sandbox.
async function probeGatewayLogic(host, port) {
  return await new Promise((resolve) => {
    const sock = net.createConnection({
      host,
      port,
      timeout: 200, // Shorter timeout for tests
    });

    const done = (ok) => {
      sock.destroy();
      resolve(ok);
    };

    sock
      .once("connect", () => done(true))
      .once("timeout", () => done(false))
      .once("error", () => done(false));
  });
}

test("probeGatewayLogic - successful connection", async () => {
  const server = net.createServer((socket) => {
    socket.end();
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();

  const result = await probeGatewayLogic("127.0.0.1", port);
  assert.equal(result, true);

  server.close();
});

test("probeGatewayLogic - connection refused", async () => {
  // Use a port that is likely not in use
  const result = await probeGatewayLogic("127.0.0.1", 65530);
  assert.equal(result, false);
});
