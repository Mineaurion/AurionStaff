import { APIEmbedField } from 'discord-api-types/v10';
import { ApplicationCommandPermissions, EmbedField, Guild } from 'discord.js';
import { ApplicationCommandMixin, SimpleCommandMessage } from 'discordx';
import fetch, { RequestInfo, RequestInit } from 'node-fetch';

export const http = async <T>(
  request: RequestInfo,
  init?: RequestInit,
): Promise<T> => {
  const response = await fetch(request, init);
  if (!response.ok) {
    throw response.statusText;
  }
  const body = await response.text();
  if (body) {
    return JSON.parse(body) as T;
  }
  return JSON.parse('{}');
};

export const searchFieldValueFromFields = (
  fields: EmbedField[] | APIEmbedField[] | undefined,
  searchField: string,
): string | undefined => {
  return fields?.find((field) => field.name === searchField)?.value;
};

/**
 * @description Suivant le nom de la commande permet de retourner un tableau des groupes qui ont accès à la commande.
 * La variable permissionConfig permet de configurer les roles qui ont accès à la commande en question.
 * La fonction part du principe que chaque commande avec l'annotation @Permission(staffPermission) doit avoir une config
 */
export const staffPermission = (
  guild: Guild,
  cmd: ApplicationCommandMixin | SimpleCommandMessage,
): ApplicationCommandPermissions | ApplicationCommandPermissions[] => {
  const roleCmd = permissionConfig[cmd.name];
  if (!roleCmd) {
    throw new Error(
      `La commande ${cmd.name} n'existe pas dans le tableau de configuration, merci de l'ajouter`,
    );
  }
  const permissions: ApplicationCommandPermissions[] = [];
  roleCmd.forEach((roleName) => {
    const roleId = guild.roles.cache.find((role) => role.name === roleName)?.id;
    if (roleId) {
      permissions.push({
        id: roleId,
        permission: true,
        type: 'ROLE',
      });
    }
  });

  if (permissions.length > 0) {
    return permissions;
  } else {
    throw new Error(
      "Aucun des roles fournis n'a pas être trouver, le bot ne pourra pas fonctionner",
    );
  }
};

// La clef est le nom de la commande et le tableau contient les noms des roles qui ont accès à la commande
const permissionConfig: Record<string, string[]> = {
  multicraft: ['Rouges', 'Admin'],
  pterodactyl: ['Rouges', 'Admin'],
  chuck: ['Staff'],
};
