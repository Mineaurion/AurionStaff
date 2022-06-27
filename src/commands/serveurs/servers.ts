import {
  ButtonInteraction,
  CommandInteraction,
  MessageActionRow,
  MessageButton,
  MessageSelectMenu,
  MessageSelectOptionData,
  ModalSubmitInteraction,
  SelectMenuInteraction,
  WebhookEditMessageOptions,
} from 'discord.js';
import {
  Discord,
  Slash,
  Permission,
  ModalComponent,
  ButtonComponent,
  SelectMenuComponent,
} from 'discordx';
import { container, injectable } from 'tsyringe';
import { CacheLocal } from '../../utils/cache_locale.js';
import { ValidationError, staffPermission } from '../../utils/helper.js';
import { modals } from './config.js';
import { Server } from './model';
import { AbstractModal, FlattenTypeModal } from '../../libs/AbstractModal.js';
import { ServersService } from './serversService.js';
import { format } from 'util';
import flat from 'flat';

@Discord()
@injectable()
@Permission(false)
@Permission(staffPermission)
export class Servers extends AbstractModal<Server> {
  constructor(private service: ServersService) {
    const cacheLocal: CacheLocal = container.resolve('CacheLocal');
    super(cacheLocal, 'servers', modals);
  }

  @Slash('serveurs', {
    description: 'Menu des serveurs pour Pterodactyl',
  })
  async slashCommand(interaction: CommandInteraction): Promise<void> {
    const row = new MessageActionRow().addComponents(
      new MessageButton()
        .setLabel("Création d'un serveur")
        .setStyle('PRIMARY')
        .setCustomId('servers-modalButton-0'),
      new MessageButton()
        .setLabel("Edition d'un serveur")
        .setStyle('SECONDARY')
        .setCustomId('servers-edit'),
      new MessageButton()
        .setLabel("Suppression d'un serveur")
        .setStyle('DANGER')
        .setCustomId('servers-remove'),
    );

    await interaction.reply({
      content: 'Menu de gestion des serveurs',
      ephemeral: true,
      components: [row],
    });
  }

  @ButtonComponent(/servers-(edit|remove)/)
  async handleEdit(interaction: ButtonInteraction): Promise<void> {
    await interaction.deferUpdate();
    const action = interaction.customId.split('-').at(-1) as string;
    const serversListOption = await this.getSelectionOptionServer();
    if (serversListOption.length > 0) {
      interaction.editReply({
        content: 'Selection le serveur',
        components: [
          new MessageActionRow().addComponents(
            new MessageSelectMenu()
              .addOptions(serversListOption)
              .setCustomId(`servers-choice-${action}`),
          ),
        ],
      });
    } else {
      interaction.editReply("Aucun serveur n'a été trouvé");
    }
  }

  @SelectMenuComponent('servers-choice-remove')
  async handleServerRemoveChoice(
    interaction: SelectMenuInteraction,
  ): Promise<void> {
    await interaction.deferUpdate();
    const choice = interaction.values[0];
    await interaction.editReply({
      content: 'Etes-vous sur de vouloir supprimer ce serveur ?',
      components: [
        new MessageActionRow().addComponents(
          new MessageButton()
            .setLabel('Oui')
            .setCustomId(`servers-choice-remove-yes-${choice}`)
            .setStyle('SUCCESS'),
          new MessageButton()
            .setLabel('Non')
            .setCustomId(`servers-choice-remove-no-${choice}`)
            .setStyle('DANGER'),
        ),
      ],
    });
  }

  @ButtonComponent(/servers-choice-remove-(yes|no)-[0-9]+/)
  async handleServerRemoveChoiceConfirm(
    interaction: ButtonInteraction,
  ): Promise<void> {
    await interaction.deferUpdate();
    const splitCustomId = interaction.customId.split('-');
    const confirm = splitCustomId.at(-2) === 'yes' ? true : false;
    const serverId = parseInt(splitCustomId.at(-1) as string);
    const messagePayload: WebhookEditMessageOptions = {
      content: "Aucune action n'a été réalisé",
      components: [],
    };
    try {
      if (confirm) {
        await this.service.deleteServer(serverId);
        messagePayload.content = `Le serveur ${serverId} vient d'être supprimer`;
      }
    } catch (error) {
      messagePayload.content = `L'api renvoie l'erreur suivante ${
        error as string
      }`;
    }
    await interaction.editReply(messagePayload);
  }

  @SelectMenuComponent('servers-choice-edit')
  async handleServerEditChoice(
    interaction: SelectMenuInteraction,
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
      components: [this.getInteractionStep()],
    });
  }

  @ButtonComponent(/servers-modalButton-[0-9]/)
  async handleStep(interaction: ButtonInteraction): Promise<void> {
    await this.sendModal(
      parseInt(interaction.customId.split('-')[2]),
      interaction,
    );
  }

  @ModalComponent(/servers-modal-[0-9]/)
  async handleModal(interaction: ModalSubmitInteraction): Promise<void> {
    await this.handleNextStep(
      parseInt(interaction.customId.split('-')[2]),
      interaction,
    );
  }

  @ButtonComponent('servers-modalButton-final')
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
          content: `Création/Mise à jour du serveur avec succés avec l'id ${serverCreateUpdate.id}`,
          components: [],
        });
      } catch (error) {
        const messagePayload: WebhookEditMessageOptions = {
          components: [
            this.getInteractionStep(),
            new MessageActionRow().addComponents(
              new MessageButton()
                .setLabel("Relancer l'appel api ?")
                .setStyle('PRIMARY')
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

  private async getSelectionOptionServer(): Promise<MessageSelectOptionData[]> {
    const servers = await this.service.getServers();
    return servers.map((server) => {
      return {
        label: server.name,
        value: server.id.toString(),
      };
    });
  }
}
