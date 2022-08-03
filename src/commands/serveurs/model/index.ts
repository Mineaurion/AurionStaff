import { TextInputStyle } from 'discord.js';

export interface ModalConfig {
  title: string;
  elements: ModalElement[];
}

interface ModalElement {
  id: string;
  value?: string;
  label: string;
  style: TextInputStyle;
  type: 'boolean' | 'string' | 'number';
}
