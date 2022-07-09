import { ModalConfig } from './model';

export const modals: ModalConfig[] = [
  {
    title: 'Etape 1',
    elements: [
      {
        id: 'name',
        label: 'Nom du serveur',
        style: 'SHORT',
        type: 'string',
      },
      {
        id: 'version.minecraft',
        label: 'Version Minecraft',
        style: 'SHORT',
        type: 'string',
      },
      {
        id: 'version.modpack',
        label: 'Version du modpack',
        style: 'SHORT',
        type: 'string',
      },
      {
        id: 'type',
        label: 'Type du modpack (overworld ou skyblock)',
        style: 'SHORT',
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
        style: 'SHORT',
        type: 'boolean',
      },
      {
        id: 'access.donator',
        label: 'Donateur Only ?',
        style: 'SHORT',
        type: 'boolean',
      },
      {
        id: 'access.paying',
        label: 'Achat boutique ?',
        style: 'SHORT',
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
        style: 'SHORT',
        type: 'string',
      },
    ],
  },
  {
    title: 'Etape 4',
    elements: [
      {
        id: 'administration.regen',
        label: 'Regen',
        style: 'SHORT',
        type: 'boolean',
      },
      {
        id: 'administration.query.port',
        label: 'Port Query',
        style: 'SHORT',
        type: 'number',
      },
      {
        id: 'administration.query.ip',
        label: 'IP Query',
        style: 'SHORT',
        type: 'string',
      },
      {
        id: 'administration.externalId',
        label: 'UUID Pterodactyl',
        style: 'SHORT',
        type: 'string',
      },
    ],
  },
  {
    title: 'Reboot horaire',
    elements: [
      {
        id: 'schedule.reboot.0',
        label: 'Première heure du reboot',
        style: 'SHORT',
        type: 'string',
      },
      {
        id: 'schedule.reboot.1',
        label: 'Deuxième heure du reboot',
        style: 'SHORT',
        type: 'string',
      },
      {
        id: 'schedule.reboot.2',
        label: 'Troisième heure du reboot',
        style: 'SHORT',
        type: 'string',
      },
      {
        id: 'schedule.reboot.3',
        label: 'Quatrième heure du reboot',
        style: 'SHORT',
        type: 'string',
      },
    ],
  },
];
