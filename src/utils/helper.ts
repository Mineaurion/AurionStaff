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
    console.error('Erreur fetching', request);
    if (response.status === 400) {
      const body = (await response.json()) as Record<string, string>;
      throw new ValidationError(body);
    }
    throw response.statusText;
    // throw new Error('Http Error, response is not ok');
  }
  const body = await response.text();
  if (body) {
    return JSON.parse(body) as T;
  }
  return JSON.parse('{}');
};

export class ValidationError extends Error {
  constructor(public validationErrors: Record<string, string>) {
    super('Validation Error');
  }
}

export const searchFieldValueFromFields = (
  fields: EmbedField[] | APIEmbedField[] | undefined,
  searchField: string,
): string | undefined => {
  return fields?.find((field) => field.name === searchField)?.value;
};

/**
 * @description Convertie une string en boolean.
 *
 * La convertion va faire la chose suivante :
 *
 * - Si 'true', 'on', or '1' alors true.
 * - ignore les espaces et la casse
 *
 * '  tRue  ','ON', et '1   ' ou encore 'Oui' seront évaluer à true.
 *
 */
export const strToBool = (s: string): boolean => {
  return /^\s*(true|1|on|oui)\s*$/i.test(s);
};
