import WebSocket, { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 8080 });

let clients: WebSocket[] = [];

wss.on("connection", ws => {
  clients.push(ws);

  ws.on("close", () => {
    clients = clients.filter(c => c !== ws);
  });
});

export function sendToPrinter(html: string){
  clients.forEach(c=>{
    if(c.readyState === WebSocket.OPEN){
      c.send(JSON.stringify({ html }));
    }
  });
}

console.log("🖨 Printer socket running on 8080");