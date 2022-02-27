import { HeadersInit } from 'node-fetch';
import { singleton } from 'tsyringe';
import { http } from '../../helper.js';
import {
  Player,
  Ban,
  Sanctions,
  TypeSanction,
  Kick,
  Mute,
  Warn,
  Detail,
} from './model';

@singleton()
export class ChuckService {
  private url = 'https://chuck.mineaurion.com';
  private token = 'temptoken';

  private headers: HeadersInit = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${this.token}`,
  };

  public async searchPlayer(search: string): Promise<Player[]> {
    return http<Player[]>(`${this.url}/player/search`, {
      method: 'POST',
      body: JSON.stringify({ search }),
      headers: this.headers,
    });
  }

  public async getPlayer(uuid: string): Promise<Player> {
    return http<Player>(`${this.url}/player/${uuid}`);
  }

  public async getPlayerDetail(uuid: string): Promise<Detail> {
    return http<Detail>(`${this.url}/player/${uuid}/detail`);
  }

  public async getPlayerBan(uuid: string): Promise<Ban[]> {
    return this.getPlayerSanctions(uuid, 'ban');
  }

  public async getPlayerKick(uuid: string): Promise<Kick[]> {
    return this.getPlayerSanctions(uuid, 'kick');
  }

  public async getPlayerMute(uuid: string): Promise<Mute[]> {
    return this.getPlayerSanctions(uuid, 'mute');
  }

  public async getPlayerWarn(uuid: string): Promise<Warn[]> {
    return this.getPlayerSanctions(uuid, 'warn');
  }

  private async getPlayerSanctions<T extends Sanctions>(
    uuid: string,
    type: TypeSanction,
  ): Promise<T> {
    return http<T>(`${this.url}/player/${uuid}/${type}`, {
      headers: this.headers,
    });
  }
}
