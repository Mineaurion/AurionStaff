import NodeCache from 'node-cache';
import { singleton } from 'tsyringe';

type Key = string | number;

@singleton()
export class CacheLocal {
  private static _instance: CacheLocal;

  private ttlSeconds: number = parseInt(process.env.CACHE_TTL as string);

  private cache: NodeCache = new NodeCache({
    stdTTL: this.ttlSeconds,
    checkperiod: this.ttlSeconds * 0.2,
    useClones: false,
  });

  public get<T>(key: Key): T | undefined {
    return this.cache.get<T>(key);
  }

  public set<T>(key: Key, value: T): void {
    this.cache.set(key, value);
  }

  public del(key: Key): void {
    this.cache.del(key);
  }
}
