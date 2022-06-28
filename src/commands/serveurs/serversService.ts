import { HeadersInit } from 'node-fetch';
import { singleton } from 'tsyringe';
import { http } from '../../utils/helper.js';
import { Server } from './model';

@singleton()
export class ServersService {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  private url = process.env.API_SERVER_DOMAIN!;
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  private token = process.env.API_SERVER_TOKEN!;

  private headers: HeadersInit = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${this.token}`,
  };

  public async getServers(): Promise<Required<Server>[]> {
    return http<Required<Server>[]>(`${this.url}/servers`, {
      headers: this.headers,
    });
  }

  public async getOneServer(id: number): Promise<Required<Server>> {
    return http<Required<Server>>(`${this.url}/servers/${id}`, {
      headers: this.headers,
    });
  }

  public async postPutServer(server: Server): Promise<Required<Server>> {
    let url = `${this.url}/servers`;
    let method = 'POST';
    if (server.id) {
      url += `/${server.id}`;
      method = 'PUT';
    }
    return http<Required<Server>>(url, {
      method,
      body: JSON.stringify(server),
      headers: this.headers,
    });
  }

  public async deleteServer(id: number): Promise<unknown> {
    return http<unknown>(`${this.url}/servers/${id}`, {
      method: 'DELETE',
      headers: this.headers,
    });
  }
}
