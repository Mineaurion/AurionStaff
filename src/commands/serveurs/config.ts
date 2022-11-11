import { TextInputStyle } from 'discord.js';
import { ModalConfig } from './model';

export const modals: ModalConfig[] = [
  {
    title: 'Etape 1',
    elements: [
      {
        id: 'name',
        label: 'Nom du serveur',
        style: TextInputStyle.Short,
        type: 'string',
      },
      {
        id: 'version.minecraft',
        label: 'Version Minecraft',
        style: TextInputStyle.Short,
        type: 'string',
      },
      {
        id: 'version.modpack',
        label: 'Version du modpack',
        style: TextInputStyle.Short,
        type: 'string',
      },
      {
        id: 'type',
        label: 'Type du modpack (overworld ou skyblock)',
        style: TextInputStyle.Short,
        type: 'string',
      },
    ],
  },
  {
    title: 'Etape 2',
    elements: [
      {
        id: 'access.beta',
        label: 'Serveur beta ?',
        style: TextInputStyle.Short,
        type: 'boolean',
      },
      {
        id: 'access.donator',
        label: 'Donateur Only ?',
        style: TextInputStyle.Short,
        type: 'boolean',
      },
      {
        id: 'access.paying',
        label: 'Achat boutique ?',
        style: TextInputStyle.Short,
        type: 'boolean',
      },
    ],
  },
  {
    title: 'Etape 3',
    elements: [
      {
        id: 'dns',
        label: 'Dns du serveur',
        style: TextInputStyle.Short,
        type: 'string',
      },
      {
        id: 'hidden',
        label: 'Cacher le serveur ?',
        style: TextInputStyle.Short,
        type: 'boolean',
      },
    ],
  },
  {
    title: 'Etape 4',
    elements: [
      {
        id: 'administration.backup',
        label: 'Backup ?',
        style: TextInputStyle.Short,
        type: 'boolean',
      },
      {
        id: 'administration.regen',
        label: 'Regen ?',
        style: TextInputStyle.Short,
        type: 'boolean',
      },
      {
        id: 'administration.externalId',
        label: 'UUID Pterodactyl',
        style: TextInputStyle.Short,
        type: 'string',
      },
    ],
  },
  {
    title: 'Etape 5',
    elements: [
      {
        id: 'administration.query.ip',
        label: 'IP Query',
        style: TextInputStyle.Short,
        type: 'string',
      },
      {
        id: 'administration.query.port',
        label: 'Port Query',
        style: TextInputStyle.Short,
        type: 'number',
      },
      {
        id: 'administration.prometheus.ip',
        label: 'Port Prometheus',
        style: TextInputStyle.Short,
        type: 'string',
      },
      {
        id: 'administration.prometheus.port',
        label: 'IP Prometheus',
        style: TextInputStyle.Short,
        type: 'number',
      },
    ],
  },
  {
    title: 'Reboot horaire',
    elements: [
      {
        id: 'schedule.reboot.0',
        label: 'Première heure du reboot',
        style: TextInputStyle.Short,
        type: 'string',
      },
      {
        id: 'schedule.reboot.1',
        label: 'Deuxième heure du reboot',
        style: TextInputStyle.Short,
        type: 'string',
      },
      {
        id: 'schedule.reboot.2',
        label: 'Troisième heure du reboot',
        style: TextInputStyle.Short,
        type: 'string',
      },
      {
        id: 'schedule.reboot.3',
        label: 'Quatrième heure du reboot',
        style: TextInputStyle.Short,
        type: 'string',
      },
    ],
  },
];
