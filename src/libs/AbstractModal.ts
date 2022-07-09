import {
  BaseMessageComponentOptions,
  ButtonInteraction,
  CacheType,
  CommandInteraction,
  MessageActionRow,
  MessageActionRowOptions,
  MessageButton,
  MessageComponentInteraction,
  Modal,
  ModalActionRowComponent,
  ModalSubmitInteraction,
  TextInputComponent,
  WebhookEditMessageOptions,
} from 'discord.js';
import { ModalConfig } from '../commands/serveurs/model';
import { CacheLocal } from '../utils/cache_locale.js';
import { strToBool } from '../utils/helper.js';
import flat from 'flat';
import { format } from 'util';

export type FlattenTypeModal = Record<string, string | boolean | number>;

export abstract class AbstractModal<T> {
  protected cacheKeyForm: string;
  protected cacheKeyEditChoice: string;
  protected totalNumberElements = 0;

  constructor(
    protected cacheLocal: CacheLocal,
    private modalName: string,
    protected config: ModalConfig[],
  ) {
    this.cacheKeyForm = `${this.modalName}-%s`;
    this.cacheKeyEditChoice = `${this.modalName}-%s-editChoice`;
    this.config.forEach((modal) => {
      this.totalNumberElements += modal.elements.length;
    });
  }

  abstract slashCommand(interaction: CommandInteraction): Promise<void>;

  abstract handleStep(interaction: ButtonInteraction): Promise<void>;

  abstract handleModal(interaction: ModalSubmitInteraction): Promise<void>;

  abstract handleFinal(interaction: ButtonInteraction): Promise<void>;

  protected async sendModal(
    modalNumber: number,
    interaction: MessageComponentInteraction<CacheType>,
  ): Promise<void> {
    const modalConfig = this.config[modalNumber];
    const modal = new Modal()
      .setTitle(modalConfig.title)
      .setCustomId(`${this.modalName}-modal-${modalNumber}`);

    modalConfig.elements.forEach((element) => {
      const textComponent = new TextInputComponent()
        .setCustomId(element.id)
        .setLabel(element.label)
        .setStyle(element.style);
      const editChoice: FlattenTypeModal = flat.flatten(
        this.cacheLocal.get(
          format(this.cacheKeyEditChoice, interaction.user.id),
        ) || {},
      );
      if (editChoice && editChoice[element.id]) {
        const value = editChoice[element.id];
        textComponent.setValue(value.toString());
      }
      modal.addComponents(
        new MessageActionRow<ModalActionRowComponent>().addComponents(
          textComponent,
        ),
      );
    });
    await interaction.showModal(modal);
  }

  private handleForm(
    modalNumber: number,
    interaction: ModalSubmitInteraction,
  ): FlattenTypeModal {
    const cacheKey = format(this.cacheKeyForm, interaction.user.id);
    if (
      modalNumber === 0 &&
      this.cacheLocal.get<FlattenTypeModal>(cacheKey) === undefined
    ) {
      this.cacheLocal.set(cacheKey, {});
    }
    const modalResponse = this.cacheLocal.get<FlattenTypeModal>(cacheKey);
    const formResponse: FlattenTypeModal = {};
    this.config[modalNumber].elements.forEach((element) => {
      const field: string = interaction.fields.getTextInputValue(element.id);
      switch (element.type) {
        case 'number':
          formResponse[element.id] = parseInt(field);
          break;
        case 'boolean':
          formResponse[element.id] = strToBool(field);
          break;
        default:
          formResponse[element.id] = field;
          break;
      }
    });

    this.cacheLocal.set(cacheKey, {
      ...modalResponse,
      ...formResponse,
    });
    return this.cacheLocal.get(cacheKey) as FlattenTypeModal;
  }

  protected async handleNextStep(
    modalNumber: number,
    interaction: ModalSubmitInteraction,
  ): Promise<void> {
    await interaction.deferUpdate();
    const form = this.handleForm(modalNumber, interaction);
    const nextStepId =
      modalNumber + 1 >= this.config.length ? undefined : modalNumber + 1;
    const components: (
      | MessageActionRow
      | (Required<BaseMessageComponentOptions> & MessageActionRowOptions)
    )[] = [];
    if (nextStepId && Object.keys(form).length < this.totalNumberElements) {
      components.push(
        new MessageActionRow().addComponents(
          new MessageButton()
            .setLabel('Continue ?')
            .setStyle('PRIMARY')
            .setCustomId(`${this.modalName}-modalButton-${nextStepId}`),
        ),
      );
    } else if (Object.keys(form).length >= this.totalNumberElements) {
      components.push(
        this.getInteractionStep(),
        new MessageActionRow().addComponents(
          new MessageButton()
            .setLabel('Créer ou mettre à jour')
            .setStyle('SUCCESS')
            .setCustomId(`${this.modalName}-modalButton-final`)
            .setEmoji('▶️'),
        ),
      );
    }
    await interaction.editReply({
      content: `\`\`\`JSON\n${JSON.stringify(
        flat.unflatten(form),
        null,
        2,
      )}\n\`\`\``,
      components,
    });
  }

  protected getInteractionStep(): MessageActionRow {
    const row = new MessageActionRow();
    for (let modalNumber = 0; modalNumber < this.config.length; modalNumber++) {
      row.addComponents(
        new MessageButton()
          .setCustomId(`servers-modalButton-${modalNumber}`)
          .setLabel(`Etape ${modalNumber + 1}`)
          .setStyle('PRIMARY'),
      );
    }
    return row;
  }
}
