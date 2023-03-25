import {
  ButtonInteraction,
  CommandInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  StringSelectMenuBuilder,
  SelectMenuComponentOptionData,
  ModalSubmitInteraction,
  MessageActionRowComponentBuilder,
  ButtonStyle,
  InteractionEditReplyOptions,
  StringSelectMenuInteraction,
} from 'discord.js';
import {
  Discord,
  Slash,
  ModalComponent,
  ButtonComponent,
  SelectMenuComponent,
} from 'discordx';
import { container, injectable } from 'tsyringe';
import { CacheLocal } from '../../utils/cache_locale.js';
import { ValidationError } from '../../utils/helper.js';
import { modals } from './config.js';
import { Server } from '@mineaurion/api';
import { AbstractModal, FlattenTypeModal } from '../../libs/AbstractModal.js';
import { ServersService } from './serversService.js';
import { format } from 'util';
import flat from 'flat';

@Discord()
@injectable()
export class Servers extends AbstractModal<Server> {
  constructor(private service: ServersService) {
    const cacheLocal: CacheLocal = container.resolve('CacheLocal');
    super(cacheLocal, 'servers', modals);
  }

  @Slash({
    name: 'serveurs',
    description: 'Menu des serveurs',
  })
  async slashCommand(interaction: CommandInteraction): Promise<void> {
    const row =
      new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel("Création d'un serveur")
          .setStyle(ButtonStyle.Primary)
          .setCustomId('servers-modalButton-0'),
        new ButtonBuilder()
          .setLabel("Edition d'un serveur")
          .setStyle(ButtonStyle.Secondary)
          .setCustomId('servers-edit'),
        new ButtonBuilder()
          .setLabel("Suppression d'un serveur")
          .setStyle(ButtonStyle.Danger)
          .setCustomId('servers-remove'),
      );

    await interaction.reply({
      content: 'Menu de gestion des serveurs',
      ephemeral: true,
      components: [row],
    });
  }

  @ButtonComponent({ id: /servers-(edit|remove)/ })
  async handleEdit(interaction: ButtonInteraction): Promise<void> {
    await interaction.deferUpdate();
    const action = interaction.customId.split('-').at(-1) as string;
    const serversListOption = await this.getSelectionOptionServer();
    if (serversListOption.length > 0) {
      await interaction.editReply({
        content: 'Selection le serveur',
        components: [
          new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
            new StringSelectMenuBuilder()
              .addOptions(serversListOption)
              .setCustomId(`servers-choice-${action}`),
          ),
        ],
      });
    } else {
      await interaction.editReply({
        content: "Aucun serveur n'a été trouvé",
      });
    }
  }

  @SelectMenuComponent({ id: 'servers-choice-remove' })
  async handleServerRemoveChoice(
    interaction: StringSelectMenuInteraction,
  ): Promise<void> {
    await interaction.deferUpdate();
    const choice = interaction.values[0];
    await interaction.editReply({
      content: 'Etes-vous sûr de vouloir supprimer ce serveur ?',
      components: [
        new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
          new ButtonBuilder()
            .setLabel('Oui')
            .setCustomId(`servers-choice-remove-yes-${choice}`)
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setLabel('Non')
            .setCustomId(`servers-choice-remove-no-${choice}`)
            .setStyle(ButtonStyle.Danger),
        ),
      ],
    });
  }

  @ButtonComponent({ id: /servers-choice-remove-(yes|no)-[0-9]+/ })
  async handleServerRemoveChoiceConfirm(
    interaction: ButtonInteraction,
  ): Promise<void> {
    await interaction.deferUpdate();
    const splitCustomId = interaction.customId.split('-');
    const confirm = splitCustomId.at(-2) === 'yes';
    const serverId = parseInt(splitCustomId.at(-1) as string);
    const messagePayload: InteractionEditReplyOptions = {
      content: "Aucune action n'a été réalisée",
      components: [],
    };
    try {
      if (confirm) {
        await this.service.deleteServer(serverId);
        messagePayload.content = `Le serveur ${serverId} vient d'être supprimé`;
      }
    } catch (error) {
      messagePayload.content = `L'api renvoie l'erreur suivante ${
        error as string
      }`;
    }
    await interaction.editReply(messagePayload);
  }

  @SelectMenuComponent({ id: 'servers-choice-edit' })
  async handleServerEditChoice(
    interaction: StringSelectMenuInteraction,
  ): Promise<void> {
    await interaction.deferUpdate();
    const server = flat.flatten(
      await this.service.getOneServer(parseInt(interaction.values[0])),
    );
    this.cacheLocal.set(
      format(this.cacheKeyEditChoice, interaction.user.id),
      server,
    );
    this.cacheLocal.set(format(this.cacheKeyForm, interaction.user.id), server);
    await interaction.editReply({
      components: [...this.getInteractionStep()],
    });
  }

  @ButtonComponent({ id: /servers-modalButton-[0-9]/ })
  async handleStep(interaction: ButtonInteraction): Promise<void> {
    await this.sendModal(
      parseInt(interaction.customId.split('-')[2]),
      interaction,
    );
  }

  @ModalComponent({ id: /servers-modal-[0-9]/ })
  async handleModal(interaction: ModalSubmitInteraction): Promise<void> {
    await this.handleNextStep(
      parseInt(interaction.customId.split('-')[2]),
      interaction,
    );
  }

  @ButtonComponent({ id: 'servers-modalButton-final' })
  async handleFinal(interaction: ButtonInteraction): Promise<void> {
    await interaction.deferUpdate();
    const server = flat.unflatten<FlattenTypeModal, Server>(
      this.cacheLocal.get(
        format(this.cacheKeyForm, interaction.user.id),
      ) as FlattenTypeModal,
    );
    if (server) {
      try {
        const serverCreateUpdate = await this.service.postPutServer(server);
        this.cacheLocal.del(
          format(this.cacheKeyEditChoice, interaction.user.id),
        );
        this.cacheLocal.del(format(this.cacheKeyForm, interaction.user.id));
        await interaction.editReply({
          content: `Création/Mise à jour du serveur avec succès avec l'id ${serverCreateUpdate.id}`,
          components: [],
        });
      } catch (error) {
        const messagePayload: InteractionEditReplyOptions = {
          components: [
            ...this.getInteractionStep(),
            new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
              new ButtonBuilder()
                .setLabel("Relancer l'appel api ?")
                .setStyle(ButtonStyle.Primary)
                .setCustomId(interaction.customId)
                .setEmoji('🔁'),
            ),
          ],
        };
        if (error instanceof ValidationError) {
          messagePayload.content = `L'api renvoie l'erreur suivante : \`\`\`JSON\n${JSON.stringify(
            error.validationErrors,
            null,
            2,
          )}\n
            \`\`\``;
        } else {
          messagePayload.content = `L'api renvoie l'erreur suivante : ${
            error as string
          }`;
        }
        await interaction.editReply(messagePayload);
      }
    }
  }

  private async getSelectionOptionServer(): Promise<
    SelectMenuComponentOptionData[]
  > {
    const servers = await this.service.getServers();
    return servers.map((server) => {
      return {
        label: server.name,
        value: server.id.toString(),
      };
    });
  }
}
