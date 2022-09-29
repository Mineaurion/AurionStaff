export interface Player {
  uuid: string;
  nickname: string;
}

export interface Ban extends Mute {
  ip?: string;
}

export interface Mute {
  id: number;
  player: Player;
  reason: string;
  server: string;
  performer_nickname: string;
  date_begin: string;
  date_end: string;
  undoer_nickname: string;
  undoer_reason: string;
  undoer_date: string;
  active: boolean;
}

export interface Kick {
  id: number;
  player: Player;
  reason: string;
  performer_nickname: string;
  date: string;
  server: string;
}

export type Warn = Kick;

export interface SearchConnection {
  [server: string]: Connection[];
}

export interface Connection {
  id: number;
  player: Player;
  date_login: string;
  date_logout: string;
  server: string;
}

export interface Detail {
  firstLogin: ConnectionDate;
  lastLogout: ConnectionDate;
  player: {
    uuid: string;
    nickname: string;
  };
  playTimes: MinutesPlayed[];
  sanctions: {
    stats: {
      bans: number;
      mutes: number;
      kicks: number;
      warns: number;
    };
    state: {
      banned: boolean;
      muted: boolean;
    };
  };
}

export interface MinutesPlayed {
  minutes: number | string;
  server: string;
}

interface ConnectionDate {
  date_login: string | null;
  date_logout: string | null;
}

export type Sanctions = Ban[] | Mute[] | Kick[] | Warn[];
type Sanction = Ban | Mute | Kick | Warn;

enum TypeSanctionEnum {
  Ban = 'ban',
  Kick = 'kick',
  Mute = 'mute',
  Warn = 'warn',
}

export type TypeSanction = `${TypeSanctionEnum}`;
