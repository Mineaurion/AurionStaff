import { TextInputStyleResolvable } from 'discord.js';

export interface Server {
  id?: number;
  name: string;
  version: {
    minecraft: string;
    modpack: string;
  };
  type: 'overworld' | 'skyblock';
  access: {
    beta: boolean;
    donator: boolean;
    paying: boolean;
  };
  dns: string;
  administration: {
    regen: boolean;
    query: Address;
    externalId: string; // UUID pterodactyl - Full Uuid
  };
  schedule?: {
    reboot: string[];
  };
}

interface Address {
  ip: string;
  port: number;
}

export interface ModalConfig {
  title: string;
  elements: ModalElement[];
}

interface ModalElement {
  id: string;
  value?: string;
  label: string;
  style: TextInputStyleResolvable;
  type: 'boolean' | 'string' | 'number';
}
