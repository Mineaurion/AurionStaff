import {
  ButtonInteraction,
  CacheType,
  CommandInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  MessageComponentInteraction,
  ModalBuilder,
  ModalSubmitInteraction,
  TextInputBuilder,
  MessageActionRowComponentBuilder,
  ButtonStyle,
  ActionRowData,
  MessageActionRowComponentData,
  JSONEncodable,
  APIActionRowComponent,
  APIMessageActionRowComponent,
} from 'discord.js';
import { ModalConfig } from '../commands/serveurs/model';
import { CacheLocal } from '../utils/cache_locale.js';
import { strToBool } from '../utils/helper.js';
import { unflatten } from 'flat';
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
    const modal = new ModalBuilder()
      .setTitle(modalConfig.title)
      .setCustomId(`${this.modalName}-modal-${modalNumber}`);

    modalConfig.elements.forEach((element) => {
      const textComponent = new TextInputBuilder()
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
        new ActionRowBuilder<TextInputBuilder>().addComponents(textComponent),
      );
    });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
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
    await interaction.deferReply({ ephemeral: true });
    const form = this.handleForm(modalNumber, interaction);
    const nextStepId =
      modalNumber + 1 >= this.config.length ? undefined : modalNumber + 1;
    const components: (
      | JSONEncodable<APIActionRowComponent<APIMessageActionRowComponent>>
      | ActionRowData<
          MessageActionRowComponentData | MessageActionRowComponentBuilder
        >
      | APIActionRowComponent<APIMessageActionRowComponent>
    )[] = [];
    if (nextStepId && Object.keys(form).length < this.totalNumberElements) {
      components.push(
        new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
          new ButtonBuilder()
            .setLabel('Continue ?')
            .setStyle(ButtonStyle.Primary)
            .setCustomId(`${this.modalName}-modalButton-${nextStepId}`),
        ),
      );
    } else if (Object.keys(form).length >= this.totalNumberElements) {
      this.getInteractionStep().forEach((row) => components.push(row));
      components.push(
        new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
          new ButtonBuilder()
            .setLabel('Créer ou mettre à jour')
            .setStyle(ButtonStyle.Success)
            .setCustomId(`${this.modalName}-modalButton-final`)
            .setEmoji('▶️'),
        ),
      );
    }
    await interaction.editReply({
      content: `\`\`\`JSON\n${JSON.stringify(
        unflatten(form),
        null,
        2,
      )}\n\`\`\``,
      components,
    });
  }

  protected getInteractionStep(): ActionRowBuilder<MessageActionRowComponentBuilder>[] {
    const rowArray = [];
    let row = new ActionRowBuilder<MessageActionRowComponentBuilder>();
    for (let modalNumber = 0; modalNumber < this.config.length; modalNumber++) {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`servers-modalButton-${modalNumber}`)
          .setLabel(`Etape ${modalNumber + 1}`)
          .setStyle(ButtonStyle.Primary),
      );
      if (modalNumber % 4 === 0) {
        rowArray.push(row);
        row = new ActionRowBuilder<MessageActionRowComponentBuilder>();
      }
    }
    return rowArray;
  }
}
