// Lib : https://github.com/Shockbyte/multicraft-api-node
// https://github.com/Shockbyte/multicraft-api-node/blob/master/methods.json cela liste les methodes dispo dans la lib
declare class MulticraftAPI {
  constructor({ url, user, key }: { url: string; user: string; key: string });

  listServers(): Promise<ServerList>;
  startServer({id}: {id: string}): Promise<PowerResponse>;
  stopServer({id}: {id: string}): Promise<PowerResponse>;
  restartServer({id}: {id: string}): Promise<PowerResponse>;
}

interface BaseResponse {
  success: boolean;
  errors: string[];
}

interface ServerList implements BaseResponse{
  data: {
    Servers: Record<string, string>
  }
}

interface PowerResponse implements BaseResponse {
  data: []
}

declare module 'multicraft-api-node' {
  export = MulticraftAPI;
}
