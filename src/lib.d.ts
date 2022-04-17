// Lib : https://github.com/Shockbyte/multicraft-api-node
// https://github.com/Shockbyte/multicraft-api-node/blob/master/methods.json cela liste les methodes dispo dans la lib
declare class MulticraftAPI {
  url: string;
  user: string;
  key: string;
  constructor({ url, user, key }: { url: string; user: string; key: string });

  listServers(): Promise<ServerList>;
  startServer({ id }: { id: string }): Promise<PowerResponse>;
  stopServer({ id }: { id: string }): Promise<PowerResponse>;
  restartServer({ id }: { id: string }): Promise<PowerResponse>;
  getServerStatus({ id }: { id: string }): Promise<ServerStatus>;
}

interface BaseResponse {
  success: boolean;
  errors: string[];
}

interface ServerList {
  data: {
    Servers: Record<string, string>;
  };
}

interface ServerStatus {
  data: {
    status: 'online' | 'offline';
    onlinePlayers: number;
    players: string[];
    maxPlayers: string;
  };
}

interface PowerResponse {
  data: [];
}

declare module 'multicraft-api-node' {
  export = MulticraftAPI;
}
