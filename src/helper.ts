import { APIEmbedField } from 'discord-api-types/v10';
import { EmbedField } from 'discord.js';
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
  fields: EmbedField[] | APIEmbedField[],
  searchField: string,
): string | undefined => {
  // On assume que l'id existe toujours du coup on cast en string
  return fields.find((field) => field.name === searchField)?.value;
};
