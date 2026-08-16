import {
    Client,
    GatewayIntentBits,
    PermissionsBitField,
    SlashCommandBuilder,
    REST,
    Routes,
    EmbedBuilder,
    ChannelType,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} from 'discord.js';

import fs from 'fs';
import http from 'node:http';

// ======================================================
// BOT
// ======================================================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ]
});

// ======================================================
// CONFIGURAÇÕES
// ======================================================

const CANAL_LOGS = '📋・logs';

const CARGO_SUPORTE = '1537432685075496980';

// ======================================================
// PAINEL VIP / TICKETS / ECONOMIA
// ======================================================
const CANAL_VIP = '1538611994926514198';
const CATEGORIA_TICKETS = '1538290771843752067';

const VIP_COMPRAS = {
    prata: { nome: 'VIP Prata', cargoId: '1538379784827043880', xp: 15000, preco: 20, emoji: '💎' },
    ouro: { nome: 'VIP Ouro', cargoId: '1538379970253033633', xp: 20000, preco: 25, emoji: '🥇' },
    diamante: { nome: 'VIP Diamante', cargoId: '1538380206476103761', xp: 30000, preco: 35, emoji: '💎' },
    magnata: { nome: 'VIP Magnata', cargoId: '1538380498789994598', xp: 70000, preco: 50, emoji: '👑' },
    black: { nome: 'VIP Black', cargoId: '1538380635553538109', xp: 95000, preco: 100, emoji: '🖤' },
    legendary: { nome: 'VIP Legendery', cargoId: '1538380285551452222', xp: 140000, preco: 145, emoji: '✨' }
};

const COOLDOWN_FUN = 5000;
const respostas8Ball = [
    '🎱 Sim, com certeza!', '🎱 Provavelmente sim.', '🎱 As chances são boas.',
    '🎱 Talvez.', '🎱 Melhor não contar com isso.', '🎱 Provavelmente não.',
    '🎱 Não.', '🎱 O futuro está incerto.'
];

const CARGO_AUTOROLE = '1537433971367874610';

// ======================================================
// CANAIS DOS COMANDOS
// ======================================================

const CANAL_COMANDOS_VIP = '1538394548848558201';

const CANAL_COMANDOS = '1538394055359340605';

const CANAL_MODERACAO = '1538393615234240583';

// ======================================================
// GRUPOS DE COMANDOS POR CANAL
// ======================================================

const COMANDOS_VIP = new Set([
    'vip'
]);

const COMANDOS_MODERACAO = new Set([
    'mute',
    'ban',
    'kick',
    'cargo',
    'tirarcargo',
    'limpar',
    'protecao',
    'castigo',
    'tirarcastigo'
]);

const COMANDOS_NORMAIS = new Set([
    'info',
    'casar',
    'divorcio',
    'beijo',
    'abraco',
    'carinho',
    'presente',
    'amizade',
    'tapa',
    'gf',
    'xcam',
    'perfil',
    'relacionamento',
    'ranking',
    'xp',
    'ajuda',
    'castigo-status',
    'viptime',
    'addxp', 'removexp', 'saldo', 'daily', 'work', 'transferir', 'loja', 'comprar', 'inventario', 'ricos', 'metas',
    '8ball', 'caraoucoroa', 'dados', 'adivinha', 'rankingdiversao'
]);

// ======================================================
// VERIFICAR CANAL DO COMANDO
// ======================================================

function verificarCanalComando(interaction) {

    const comando = interaction.commandName;

    if (COMANDOS_VIP.has(comando)) {

        if (
            interaction.channelId !==
            CANAL_COMANDOS_VIP
        ) {

            return {
                permitido: false,
                mensagem:
                    `❌ Os comandos VIP só podem ser usados no canal <#${CANAL_COMANDOS_VIP}>.`
            };

        }

        return {
            permitido: true
        };

    }

    if (COMANDOS_MODERACAO.has(comando)) {

        if (
            interaction.channelId !==
            CANAL_MODERACAO
        ) {

            return {
                permitido: false,
                mensagem:
                    `❌ Os comandos de moderação só podem ser usados no canal <#${CANAL_MODERACAO}>.`
            };

        }

        return {
            permitido: true
        };

    }

    if (COMANDOS_NORMAIS.has(comando)) {

        if (
            interaction.channelId !==
            CANAL_COMANDOS
        ) {

            return {
                permitido: false,
                mensagem:
                    `❌ Os comandos normais só podem ser usados no canal <#${CANAL_COMANDOS}>.`
            };

        }

        return {
            permitido: true
        };

    }

    return {
        permitido: true
    };

}

// ======================================================
// SISTEMA VIP - CATEGORIAS
// ======================================================

const CATEGORIA_VIPS = '1538383491522105416';

const CATEGORIA_ALTA_CUPULA = '1538383371020013578';

// ======================================================
// CARGOS VIP
// ======================================================

const CARGOS_VIP = {
    prata: '1538379784827043880',
    gold: '1538379970253033633',
    diamond: '1538380206476103761',
    magnata: '1538380498789994598',
    black: '1538380635553538109',
    legendary: '1538380285551452222'
};

// ======================================================
// VIPS QUE PODEM CRIAR CARGO PERSONALIZADO
// ======================================================

const VIPS_COM_CARGO_PERSONALIZADO = new Set([
    'diamond',
    'magnata',
    'black',
    'legendary'
]);

// ======================================================
// ORDEM DE PRIORIDADE VIP
// ======================================================

const ORDEM_VIP = [
    {
        nome: 'Legendary',
        chave: 'legendary',
        id: CARGOS_VIP.legendary,
        categoria: CATEGORIA_ALTA_CUPULA
    },
    {
        nome: 'Magnata',
        chave: 'magnata',
        id: CARGOS_VIP.magnata,
        categoria: CATEGORIA_ALTA_CUPULA
    },
    {
        nome: 'Black',
        chave: 'black',
        id: CARGOS_VIP.black,
        categoria: CATEGORIA_ALTA_CUPULA
    },
    {
        nome: 'Diamond',
        chave: 'diamond',
        id: CARGOS_VIP.diamond,
        categoria: CATEGORIA_VIPS
    },
    {
        nome: 'Gold',
        chave: 'gold',
        id: CARGOS_VIP.gold,
        categoria: CATEGORIA_VIPS
    },
    {
        nome: 'Prata',
        chave: 'prata',
        id: CARGOS_VIP.prata,
        categoria: CATEGORIA_VIPS
    }
];

// ======================================================
// CONTROLE DE VALIDADE DOS VIPs
// ======================================================

const VIP_DURACAO_MS = 30 * 24 * 60 * 60 * 1000;

function obterRegistroVip(usuario) {
    if (!usuario.vip) usuario.vip = {};
    if (typeof usuario.vip.inicio !== 'number') usuario.vip.inicio = null;
    if (typeof usuario.vip.fim !== 'number') usuario.vip.fim = null;
    if (typeof usuario.vip.chave !== 'string') usuario.vip.chave = null;
    return usuario.vip;
}

function iniciarContagemVip(guildId, userId, chave, inicio = Date.now()) {
    const usuario = obterUsuario(guildId, userId);
    const registro = obterRegistroVip(usuario);
    registro.chave = chave;
    registro.inicio = inicio;
    registro.fim = inicio + VIP_DURACAO_MS;
    salvarDados();
    return registro;
}

function limparRegistroVip(guildId, userId) {
    const usuario = obterUsuario(guildId, userId);
    const registro = obterRegistroVip(usuario);
    registro.chave = null;
    registro.inicio = null;
    registro.fim = null;
    salvarDados();
}

function obterVipPorChave(chave) {
    return VIP_COMPRAS[chave] || null;
}

function obterChaveVipPorCargoId(roleId) {
    const entrada = Object.entries(VIP_COMPRAS).find(([, vip]) => vip.cargoId === roleId);
    return entrada ? entrada[0] : null;
}

function obterVipAtualComChave(member) {
    const vipPrioritario = ORDEM_VIP.find(v => member.roles.cache.has(v.id));
    if (!vipPrioritario) return null;
    const vip = VIP_COMPRAS[vipPrioritario.chave];
    return vip ? { chave: vipPrioritario.chave, vip } : null;
}

async function removerRecursosVipDoUsuario(guild, userId) {
    // A call e o cargo personalizado só existem se o usuário os criou pelos comandos VIP.
    await fecharCallVIP(guild, userId).catch(() => null);
    await excluirCargoPersonalizado(guild, userId).catch(() => null);
    limparRegistroVip(guild.id, userId);
}

async function processarExpiracaoVip(guild, userId) {
    const member = await guild.members.fetch(userId).catch(() => null);
    if (!member) return false;

    const atual = obterVipAtualComChave(member);
    const usuario = obterUsuario(guild.id, userId);
    const registro = obterRegistroVip(usuario);

    if (!registro.fim || Date.now() < registro.fim) return false;

    // Se ainda possui o VIP que expirou, remova somente do usuário.
    if (registro.chave) {
        const vip = obterVipPorChave(registro.chave);
        if (vip && member.roles.cache.has(vip.cargoId)) {
            const role = guild.roles.cache.get(vip.cargoId) || await guild.roles.fetch(vip.cargoId).catch(() => null);
            if (role) {
                await member.roles.remove(role, `VIP ${vip.nome} expirou após 30 dias`).catch(() => null);
            }
        }
    }

    // Atualiza o membro antes de decidir se ainda existe outro VIP.
    const membroAtualizado = await guild.members.fetch(userId).catch(() => member);

    // Só destrói a call/cargo personalizado quando não restar nenhum VIP.
    const depois = obterVipAtualComChave(membroAtualizado);
    if (!depois) {
        await removerRecursosVipDoUsuario(guild, userId);
        await enviarLog(guild, '⏰ VIP expirado', `${member} teve o VIP removido após 30 dias. A call e o cargo personalizado criados pelo sistema também foram removidos, se existiam.`).catch(() => null);
    } else {
        // Se existe outro VIP, começa uma nova contagem para o VIP que ficou.
        iniciarContagemVip(guild.id, userId, depois.chave, Date.now());
    }

    return true;
}

async function verificarVipsExpirados() {
    for (const guild of client.guilds.cache.values()) {
        const dadosGuild = dados[guild.id];
        if (!dadosGuild) continue;
        for (const userId of Object.keys(dadosGuild)) {
            const usuario = dadosGuild[userId];
            if (!usuario?.vip?.fim) continue;
            if (Date.now() >= usuario.vip.fim) {
                await processarExpiracaoVip(guild, userId).catch(erro => console.log('❌ Erro ao expirar VIP:', erro));
            }
        }
    }
}

async function registrarVipDetectado(member, chave, inicio = Date.now()) {
    const usuario = obterUsuario(member.guild.id, member.id);
    const registro = obterRegistroVip(usuario);
    if (registro.chave === chave && registro.inicio && registro.fim) return registro;
    return iniciarContagemVip(member.guild.id, member.id, chave, inicio);
}

// ======================================================
// TOKEN
// ======================================================

const TOKEN = process.env.DISCORD_TOKEN;

// ======================================================
// PROTEÇÃO
// ======================================================

const PROTECAO = {

    mensagensSpam: 6,
    intervaloSpam: 5000,

    linksMaximos: 3,
    mencoesMaximas: 5,

    entradasMaximas: 5,
    intervaloEntradas: 60000,

    timeoutSpam: 60 * 1000,

    ativacaoRaid: 5,
    janelaRaid: 10000,
    tempoModoRaid: 10 * 60 * 1000,

    limiteBanimentos: 4,
    janelaBanimentos: 10000,

    limiteCanais: 4,
    janelaCanais: 10000,

    limiteCargos: 4,
    janelaCargos: 10000,

    timeoutSuspeito: 10 * 60 * 1000
};

// ======================================================
// DADOS
// ======================================================

const ARQUIVO_DADOS = './dados.json';

let dados = {};

// ======================================================
// MEMÓRIA ANTI-RAID
// ======================================================

const entradasGuild = new Map();
const banimentosGuild = new Map();
const canaisGuild = new Map();
const cargosGuild = new Map();
const modoRaid = new Map();
const executoresSuspeitos = new Map();

// ======================================================
// CARREGAR DADOS
// ======================================================

function carregarDados() {

    try {

        if (fs.existsSync(ARQUIVO_DADOS)) {

            dados = JSON.parse(
                fs.readFileSync(
                    ARQUIVO_DADOS,
                    'utf8'
                )
            );

        } else {

            dados = {};

        }

    } catch (erro) {

        console.log(
            '❌ Erro ao carregar dados:',
            erro
        );

        dados = {};

    }

}

// ======================================================
// SALVAR DADOS
// ======================================================

function salvarDados() {

    try {

        fs.writeFileSync(
            ARQUIVO_DADOS,
            JSON.stringify(
                dados,
                null,
                2
            )
        );

    } catch (erro) {

        console.log(
            '❌ Erro ao salvar dados:',
            erro
        );

    }

}

// ======================================================
// SISTEMA DE CASTIGO
// ======================================================

function obterCastigo(guildId, userId) {

    const usuario = obterUsuario(guildId, userId);

    if (
        !usuario.castigoFim ||
        typeof usuario.castigoFim !== 'number'
    ) {
        return null;
    }

    if (Date.now() >= usuario.castigoFim) {
        return null;
    }

    return {
        fim: usuario.castigoFim,
        motivo: usuario.castigoMotivo || 'Nenhum motivo informado.'
    };

}

function limparDadosCastigo(guildId, userId) {

    const usuario = obterUsuario(guildId, userId);

    usuario.castigoFim = null;
    usuario.castigoMotivo = null;

    salvarDados();

}

function formatarTempoRestante(ms) {

    const totalSegundos = Math.max(
        0,
        Math.ceil(ms / 1000)
    );

    const dias = Math.floor(totalSegundos / 86400);
    const horas = Math.floor((totalSegundos % 86400) / 3600);
    const minutos = Math.floor((totalSegundos % 3600) / 60);
    const segundos = totalSegundos % 60;

    const partes = [];

    if (dias > 0) partes.push(`${dias}d`);
    if (horas > 0) partes.push(`${horas}h`);
    if (minutos > 0) partes.push(`${minutos}min`);
    if (segundos > 0 && partes.length < 2) partes.push(`${segundos}s`);

    return partes.length
        ? partes.join(' ')
        : 'menos de 1 segundo';
}

async function aplicarCastigo(guild, member, minutos, motivo) {

    const agora = Date.now();
    const fim = agora + (minutos * 60 * 1000);

    if (!member.moderatable) {
        throw new Error(
            'Não consigo aplicar castigo nesse usuário. Verifique a hierarquia de cargos do bot.'
        );
    }

    await member.timeout(
        minutos * 60 * 1000,
        `Castigo: ${motivo}`
    );

    // Se a pessoa estiver em uma call, desconecta imediatamente.
    if (member.voice?.channel) {
        await member.voice.disconnect(
            'Castigo aplicado pelo sistema.'
        ).catch(() => null);
    }

    const usuario = obterUsuario(
        guild.id,
        member.id
    );

    usuario.castigoFim = fim;
    usuario.castigoMotivo = motivo;

    salvarDados();

    await enviarLog(
        guild,
        '🔒 Castigo aplicado',
        `${member} recebeu castigo por **${minutos} minuto(s)**.\nMotivo: **${motivo}**`
    );

}

async function removerCastigo(guild, member, motivo = 'Castigo removido pela moderação.') {

    const castigo = obterCastigo(
        guild.id,
        member.id
    );

    if (!castigo) {
        limparDadosCastigo(guild.id, member.id);
        return false;
    }

    // Só remove o timeout se ele ainda corresponder ao castigo salvo.
    const timeoutAtual = member.communicationDisabledUntilTimestamp || 0;

    if (
        timeoutAtual > 0 &&
        timeoutAtual <= castigo.fim + 10000
    ) {
        await member.timeout(
            null,
            motivo
        );
    }

    limparDadosCastigo(
        guild.id,
        member.id
    );

    await enviarLog(
        guild,
        '🔓 Castigo removido',
        `${member} teve o castigo removido.\nMotivo: **${motivo}**`
    );

    return true;

}

async function verificarCastigosAtivos() {

    for (const guild of client.guilds.cache.values()) {

        const dadosGuild = dados[guild.id];

        if (!dadosGuild) continue;

        for (const userId of Object.keys(dadosGuild)) {

            const usuario = dadosGuild[userId];

            if (
                !usuario ||
                typeof usuario.castigoFim !== 'number'
            ) {
                continue;
            }

            const member = await guild.members
                .fetch(userId)
                .catch(() => null);

            if (!member) continue;

            if (Date.now() >= usuario.castigoFim) {

                const timeoutAtual =
                    member.communicationDisabledUntilTimestamp || 0;

                if (timeoutAtual > 0) {
                    await member.timeout(
                        null,
                        'Castigo encerrado automaticamente.'
                    ).catch(() => null);
                }

                limparDadosCastigo(
                    guild.id,
                    userId
                );

                await enviarLog(
                    guild,
                    '🔓 Castigo encerrado',
                    `${member} terminou o período de castigo automaticamente.`
                );

                continue;
            }

            // Reaplica o restante do timeout após reinício do bot/Render.
            const restante =
                usuario.castigoFim - Date.now();

            if (
                !member.communicationDisabledUntilTimestamp ||
                member.communicationDisabledUntilTimestamp < Date.now() + 5000
            ) {
                await member.timeout(
                    Math.min(restante, 28 * 24 * 60 * 60 * 1000),
                    `Restaurando castigo após reinício do bot: ${usuario.castigoMotivo || 'Sem motivo'}`
                ).catch(() => null);
            }

        }

    }

}

// ======================================================
// GARANTIR USUÁRIO
// ======================================================

function obterUsuario(guildId, userId) {

    if (!dados[guildId]) {
        dados[guildId] = {};
    }

    if (!dados[guildId][userId]) {

        dados[guildId][userId] = {

            xp: 0,
            xpTotal: 0,
            nivel: 1,
            parceiro: null,
            inventario: [],
            ultimoDaily: 0,
            ultimoWork: 0,
            pontosDiversao: 0,
            metasConcluidas: {},
            adivinha: null,
            vip: { chave: null, inicio: null, fim: null },
            xpRelacionamento: 0,
            mensagens: 0,
            comandos: 0,

            cooldowns: {
                gf: 0,
                xcam: 0
            }

        };

    }

    if (!dados[guildId][userId].cooldowns) {

        dados[guildId][userId].cooldowns = {
            gf: 0,
            xcam: 0
        };

    }

    if (
        typeof dados[guildId][userId].cooldowns.gf !== 'number'
    ) {
        dados[guildId][userId].cooldowns.gf = 0;
    }

    if (
        typeof dados[guildId][userId].cooldowns.xcam !== 'number'
    ) {
        dados[guildId][userId].cooldowns.xcam = 0;
    }

    const usuario = dados[guildId][userId];

    if (typeof usuario.xpTotal !== 'number') {
        const nivelAtual = Math.max(1, Number(usuario.nivel) || 1);
        const xpAtual = Math.max(0, Number(usuario.xp) || 0);
        usuario.xpTotal = (100 * ((nivelAtual - 1) * nivelAtual / 2)) + xpAtual;
    }

    if (!Array.isArray(usuario.inventario)) usuario.inventario = [];
    if (typeof usuario.ultimoDaily !== 'number') usuario.ultimoDaily = 0;
    if (typeof usuario.ultimoWork !== 'number') usuario.ultimoWork = 0;
    if (typeof usuario.pontosDiversao !== 'number') usuario.pontosDiversao = 0;
    if (!usuario.metasConcluidas) usuario.metasConcluidas = {};
    if (!usuario.adivinha) usuario.adivinha = null;
    obterRegistroVip(usuario);

    return usuario;

}

// ======================================================
// SISTEMA VIP
// ======================================================

function obterVipDoMembro(member) {

    return ORDEM_VIP.find(
        vip => member.roles.cache.has(vip.id)
    ) || null;

}

// ======================================================
// VERIFICAR SE PODE TER CARGO PERSONALIZADO
// ======================================================

function podeCriarCargoPersonalizado(vip) {

    if (!vip) {
        return false;
    }

    return VIPS_COM_CARGO_PERSONALIZADO.has(
        vip.chave
    );

}

// ======================================================
// NOME SEGURO DA CALL
// ======================================================

function nomeSeguroCall(username) {

    const nome = username
        .toLowerCase()
        .replace(/[^a-z0-9-]/gi, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 50);

    return nome || 'vip';

}

// ======================================================
// LIMPAR NOME DA CALL
// ======================================================

function limparNomeCall(nome) {

    const limpo = String(nome)
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-zA-Z0-9À-ÿ_-]/g, '')
        .slice(0, 80);

    return limpo || 'vip';

}

// ======================================================
// LIMPAR NOME DO CARGO
// ======================================================

function limparNomeCargo(nome) {

    const limpo = String(nome)
        .trim()
        .replace(/\s+/g, ' ')
        .slice(0, 100);

    return limpo || 'Cargo VIP';

}

// ======================================================
// LIMPAR EMOJI
// ======================================================

function limparEmoji(emoji) {

    if (!emoji) {
        return null;
    }

    const limpo = String(emoji)
        .trim()
        .slice(0, 20);

    return limpo || null;

}

// ======================================================
// VALIDAR COR HEX
// ======================================================

function validarCorHex(cor) {

    if (!cor) {
        return false;
    }

    return /^#?[0-9A-Fa-f]{6}$/.test(
        String(cor).trim()
    );

}

// ======================================================
// NORMALIZAR COR
// ======================================================

function normalizarCor(cor) {

    const valor = String(cor)
        .trim()
        .replace('#', '');

    return `#${valor.toUpperCase()}`;

}

// ======================================================
// ENCONTRAR CALL DO DONO
// ======================================================

async function obterCallDoDono(guild, userId) {

    const usuario = obterUsuario(
        guild.id,
        userId
    );

    if (!usuario.vipCallId) {
        return null;
    }

    const canal = await guild.channels
        .fetch(usuario.vipCallId)
        .catch(() => null);

    if (!canal) {

        usuario.vipCallId = null;
        usuario.vipNome = null;
        usuario.vipCategoriaId = null;

        salvarDados();

        return null;

    }

    return canal;

}

// ======================================================
// OBTER CARGO PERSONALIZADO DO VIP
// ======================================================

async function obterCargoPersonalizado(
    guild,
    userId
) {

    const usuario = obterUsuario(
        guild.id,
        userId
    );

    if (!usuario.vipCargoId) {
        return null;
    }

    const cargo = await guild.roles
        .fetch(usuario.vipCargoId)
        .catch(() => null);

    if (!cargo) {

        usuario.vipCargoId = null;
        usuario.vipCargoNome = null;
        usuario.vipCargoEmoji = null;
        usuario.vipCargoCor = null;

        salvarDados();

        return null;

    }

    return cargo;

}

// ======================================================
// CRIAR CARGO PERSONALIZADO
// ======================================================

async function criarCargoPersonalizado(
    guild,
    member,
    vip,
    nome,
    cor,
    emoji
) {

    if (!podeCriarCargoPersonalizado(vip)) {

        throw new Error(
            'Seu VIP não possui acesso ao sistema de cargo personalizado.'
        );

    }

    const cargoExistente =
        await obterCargoPersonalizado(
            guild,
            member.id
        );

    if (cargoExistente) {

        return {
            cargo: cargoExistente,
            criado: false
        };

    }

    const botMember = guild.members.me;

    if (!botMember) {

        throw new Error(
            'Não consegui encontrar o membro do bot.'
        );

    }

    if (
        !botMember.permissions.has(
            PermissionsBitField.Flags.ManageRoles
        )
    ) {

        throw new Error(
            'O bot não possui a permissão Gerenciar Cargos.'
        );

    }

    const nomeFinal =
        limparNomeCargo(nome);

    let corFinal = '#5865F2';

    if (cor && validarCorHex(cor)) {
        corFinal = normalizarCor(cor);
    }

    const emojiFinal =
        limparEmoji(emoji);

    const cargo =
        await guild.roles.create({

            name: nomeFinal,

            color: corFinal,

            mentionable: true,

            unicodeEmoji: emojiFinal,

            reason:
                `Cargo personalizado VIP ${vip.nome} criado por ${member.user.tag}`

        });

    // ==================================================
    // COLOCAR O CARGO DO BOT ACIMA DO CARGO CRIADO
    // ==================================================
    // O cargo criado pelo Discord fica abaixo do maior
    // cargo do bot somente se o bot tiver posição suficiente.
    // O sistema também verifica a hierarquia antes de usar.

    const cargoDoBot =
        guild.members.me.roles.highest;

    if (
        cargo.position >=
        cargoDoBot.position
    ) {

        await cargo.delete(
            'Cargo criado acima da hierarquia do bot.'
        ).catch(() => null);

        throw new Error(
            'O cargo do bot precisa estar acima dos cargos que ele cria.'
        );

    }

    // ==================================================
    // DAR O CARGO AO DONO
    // ==================================================

    await member.roles.add(
        cargo,
        `Cargo personalizado VIP ${vip.nome}`
    );

    // ==================================================
    // SALVAR
    // ==================================================

    const usuario =
        obterUsuario(
            guild.id,
            member.id
        );

    usuario.vipCargoId = cargo.id;
    usuario.vipCargoNome = cargo.name;
    usuario.vipCargoEmoji = emojiFinal;
    usuario.vipCargoCor = corFinal;
    usuario.vipCargoVip = vip.chave;

    salvarDados();

    // ==================================================
    // SE JÁ TIVER CALL, DAR ACESSO PELA ROLE
    // ==================================================

    const call =
        await obterCallDoDono(
            guild,
            member.id
        );

    if (call) {

        await call.permissionOverwrites.edit(
            cargo.id,
            {
                ViewChannel: true,
                Connect: true,
                Speak: true,
                Stream: true,
                UseVAD: true,
                SendMessages: true
            }
        );

    }

    await enviarLog(
        guild,
        '👑 Cargo VIP personalizado criado',
        `${member} criou o cargo ${cargo} para o VIP **${vip.nome}**.`
    );

    return {
        cargo,
        criado: true
    };

}

// ======================================================
// ATUALIZAR ACESSO DO CARGO NA CALL
// ======================================================

async function atualizarAcessoCargoNaCall(
    guild,
    userId
) {

    const cargo =
        await obterCargoPersonalizado(
            guild,
            userId
        );

    const call =
        await obterCallDoDono(
            guild,
            userId
        );

    if (!cargo || !call) {
        return;
    }

    await call.permissionOverwrites.edit(
        cargo.id,
        {
            ViewChannel: true,
            Connect: true,
            Speak: true,
            Stream: true,
            UseVAD: true
        }
    ).catch(() => null);

}

// ======================================================
// DAR CARGO PERSONALIZADO
// ======================================================

async function adicionarCargoPersonalizado(
    guild,
    donoId,
    alvo
) {

    const cargo =
        await obterCargoPersonalizado(
            guild,
            donoId
        );

    if (!cargo) {

        throw new Error(
            'O dono ainda não possui um cargo personalizado.'
        );

    }

    if (cargo.position >= guild.members.me.roles.highest.position) {

        throw new Error(
            'O cargo personalizado está acima ou no mesmo nível do maior cargo do bot.'
        );

    }

    await alvo.roles.add(
        cargo,
        `Cargo VIP personalizado concedido pelo proprietário <@${donoId}>`
    );

    // ==================================================
    // GARANTIR ACESSO À CALL
    // ==================================================

    const call =
        await obterCallDoDono(
            guild,
            donoId
        );

    if (call) {

        await call.permissionOverwrites.edit(
            cargo.id,
            {
                ViewChannel: true,
                Connect: true,
                Speak: true,
                Stream: true,
                UseVAD: true,
                SendMessages: true
            }
        );

    }

}

// ======================================================
// REMOVER CARGO PERSONALIZADO
// ======================================================

async function removerCargoPersonalizado(
    guild,
    donoId,
    alvo
) {

    const cargo =
        await obterCargoPersonalizado(
            guild,
            donoId
        );

    if (!cargo) {

        throw new Error(
            'O dono ainda não possui um cargo personalizado.'
        );

    }

    await alvo.roles.remove(
        cargo,
        `Cargo VIP personalizado removido pelo proprietário <@${donoId}>`
    );

}

// ======================================================
// CRIAR CALL VIP
// ======================================================

async function criarCallVIP(
    guild,
    member,
    vip
) {

    const categoria = await guild.channels
        .fetch(vip.categoria)
        .catch(() => null);

    if (
        !categoria ||
        categoria.type !== ChannelType.GuildCategory
    ) {

        throw new Error(
            `A categoria do VIP ${vip.nome} não foi encontrada.`
        );

    }

    const existente =
        await obterCallDoDono(
            guild,
            member.id
        );

    if (existente) {

        return {
            canal: existente,
            criada: false
        };

    }

    const botMember = guild.members.me;

    if (!botMember) {

        throw new Error(
            'Não consegui encontrar o membro do bot no servidor.'
        );

    }

    if (
        !botMember.permissions.has(
            PermissionsBitField.Flags.ManageChannels
        )
    ) {

        throw new Error(
            'O bot não possui a permissão Gerenciar Canais.'
        );

    }

    // ==================================================
    // CARGO PERSONALIZADO DO DONO
    // ==================================================

    const cargoPersonalizado =
        await obterCargoPersonalizado(
            guild,
            member.id
        );

    // ==================================================
    // PERMISSÕES DA CALL
    // ==================================================

    const permiteChatDaCall = new Set(['magnata', 'black', 'legendary']).has(vip.chave);

    const permissionOverwrites = [

        {
            id: guild.roles.everyone.id,

            deny: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.Connect,
                ...(permiteChatDaCall ? [] : [PermissionsBitField.Flags.SendMessages])
            ]
        },

        {
            id: member.id,

            allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.Connect,
                PermissionsBitField.Flags.Speak,
                PermissionsBitField.Flags.Stream,
                PermissionsBitField.Flags.UseVAD,
                ...(permiteChatDaCall ? [PermissionsBitField.Flags.SendMessages] : [] )
            ],
            deny: permiteChatDaCall ? [] : [PermissionsBitField.Flags.SendMessages]
        },

        {
            id: client.user.id,

            allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.Connect,
                PermissionsBitField.Flags.ManageChannels,
                PermissionsBitField.Flags.MoveMembers,
                PermissionsBitField.Flags.MuteMembers,
                PermissionsBitField.Flags.DeafenMembers
            ]
        }

    ];

    // ==================================================
    // SE JÁ TIVER CARGO PERSONALIZADO,
    // ELE TAMBÉM GANHA ACESSO À CALL
    // ==================================================

    if (cargoPersonalizado) {

        permissionOverwrites.push({

            id: cargoPersonalizado.id,

            allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.Connect,
                PermissionsBitField.Flags.Speak,
                PermissionsBitField.Flags.Stream,
                PermissionsBitField.Flags.UseVAD,
                ...(permiteChatDaCall ? [PermissionsBitField.Flags.SendMessages] : [])
            ],
            deny: permiteChatDaCall ? [] : [PermissionsBitField.Flags.SendMessages]

        });

    }

    // ==================================================
    // CRIAR CANAL
    // ==================================================

    const canal = await guild.channels.create({

        name:
            `🔒・${nomeSeguroCall(member.user.username)}`,

        type:
            ChannelType.GuildVoice,

        parent:
            vip.categoria,

        userLimit:
            0,

        permissionOverwrites,

        reason:
            `Call VIP ${vip.nome} criada por ${member.user.tag}`

    });

    const usuario =
        obterUsuario(
            guild.id,
            member.id
        );

    usuario.vipCallId =
        canal.id;

    usuario.vipNome =
        vip.nome;

    usuario.vipCategoriaId =
        vip.categoria;

    salvarDados();

    await enviarLog(
        guild,
        '💎 Call VIP criada',
        `${member} criou uma call **${vip.nome}** em <#${canal.id}>.`
    );

    return {
        canal,
        criada: true
    };

}

// ======================================================
// FECHAR CALL VIP
// ======================================================

async function fecharCallVIP(
    guild,
    userId
) {

    const usuario =
        obterUsuario(
            guild.id,
            userId
        );

    if (!usuario.vipCallId) {
        return false;
    }

    const canal =
        await guild.channels
            .fetch(usuario.vipCallId)
            .catch(() => null);

    usuario.vipCallId = null;
    usuario.vipNome = null;
    usuario.vipCategoriaId = null;

    salvarDados();

    if (canal) {

        await canal.delete(
            'Call VIP fechada pelo proprietário.'
        ).catch(() => null);

    }

    return true;

}

// ======================================================
// EXCLUIR CARGO PERSONALIZADO
// ======================================================

async function excluirCargoPersonalizado(
    guild,
    userId
) {

    const usuario =
        obterUsuario(
            guild.id,
            userId
        );

    if (!usuario.vipCargoId) {
        return false;
    }

    const cargo =
        await guild.roles
            .fetch(usuario.vipCargoId)
            .catch(() => null);

    usuario.vipCargoId = null;
    usuario.vipCargoNome = null;
    usuario.vipCargoEmoji = null;
    usuario.vipCargoCor = null;
    usuario.vipCargoVip = null;

    salvarDados();

    if (cargo) {

        await cargo.delete(
            'Cargo VIP personalizado excluído pelo proprietário.'
        ).catch(() => null);

    }

    return true;

}

// ======================================================
// XP
// ======================================================

function adicionarXP(
    guildId,
    userId,
    quantidade
) {

    const usuario = obterUsuario(guildId, userId);
    const valor = Math.max(0, Number(quantidade) || 0);

    usuario.xp += valor;
    usuario.xpTotal += valor;

    while (usuario.xp >= usuario.nivel * 100) {
        usuario.xp -= usuario.nivel * 100;
        usuario.nivel++;
    }

    salvarDados();

}

function obterSaldoXP(guildId, userId) {
    return Math.max(0, obterUsuario(guildId, userId).xpTotal || 0);
}

function gastarXP(guildId, userId, quantidade) {
    const usuario = obterUsuario(guildId, userId);
    const valor = Math.max(0, Number(quantidade) || 0);
    if (usuario.xpTotal < valor) return false;
    usuario.xpTotal -= valor;
    // Recalcula progresso/nível sem permitir nível menor que 1.
    let restante = usuario.xpTotal;
    let nivel = 1;
    while (restante >= nivel * 100) {
        restante -= nivel * 100;
        nivel++;
    }
    usuario.nivel = nivel;
    usuario.xp = restante;
    salvarDados();
    return true;
}

// ======================================================
// XP RELACIONAMENTO
// ======================================================

function adicionarXPRelacionamento(
    guildId,
    userId,
    parceiroId,
    quantidade
) {

    const usuario =
        obterUsuario(
            guildId,
            userId
        );

    if (
        usuario.parceiro !==
        parceiroId
    ) {
        return;
    }

    usuario.xpRelacionamento += quantidade;

    salvarDados();

}

// ======================================================
// LOG
// ======================================================

async function enviarLog(
    guild,
    titulo,
    descricao
) {

    try {

        const canal =
            guild.channels.cache.find(
                c => c.name === CANAL_LOGS
            );

        if (!canal) {
            return;
        }

        const embed =
            new EmbedBuilder()
                .setTitle(titulo)
                .setDescription(descricao)
                .setTimestamp();

        await canal.send({
            embeds: [embed]
        });

    } catch (erro) {

        console.log(
            '❌ Erro ao enviar log:',
            erro
        );

    }

}

// ======================================================
// CONTADOR ANTI-RAID
// ======================================================

function registrarEvento(
    mapa,
    guildId,
    limite,
    janela
) {

    const agora = Date.now();

    if (!mapa.has(guildId)) {
        mapa.set(guildId, []);
    }

    const registros =
        mapa.get(guildId);

    registros.push(agora);

    while (
        registros.length &&
        agora - registros[0] > janela
    ) {

        registros.shift();

    }

    return registros.length >= limite;

}

// ======================================================
// ATIVAR ANTI-RAID
// ======================================================

async function ativarModoRaid(
    guild,
    motivo
) {

    const agora = Date.now();

    const atual =
        modoRaid.get(guild.id) || 0;

    if (atual > agora) {
        return;
    }

    modoRaid.set(
        guild.id,
        agora + PROTECAO.tempoModoRaid
    );

    await enviarLog(
        guild,
        '🚨 ANTI-RAID ATIVADO',
        `**Motivo:** ${motivo}\n\n` +
        `🛡️ O servidor entrou temporariamente em modo de proteção.\n` +
        `⏱️ Duração: 10 minutos.`
    );

    console.log(
        `🚨 Anti-raid ativado em ${guild.name}: ${motivo}`
    );

}

// ======================================================
// VERIFICAR RAID
// ======================================================

function servidorEmRaid(guildId) {

    const fim =
        modoRaid.get(guildId) || 0;

    if (Date.now() >= fim) {

        modoRaid.delete(guildId);

        return false;

    }

    return true;

}

// ======================================================
// PROTEGER MEMBRO
// ======================================================

async function protegerMembro(
    member,
    motivo
) {

    try {

        if (!member) {
            return;
        }

        if (!member.moderatable) {
            return;
        }

        await member.timeout(
            PROTECAO.timeoutSuspeito,
            motivo
        );

        executoresSuspeitos.set(
            member.id,
            Date.now() +
            PROTECAO.timeoutSuspeito
        );

    } catch (erro) {

        console.log(
            '❌ Não foi possível proteger membro:',
            erro
        );

    }

}

// ======================================================
// CASAMENTO
// ======================================================

function casar(
    guildId,
    userId,
    parceiroId
) {

    const usuario =
        obterUsuario(
            guildId,
            userId
        );

    const parceiro =
        obterUsuario(
            guildId,
            parceiroId
        );

    usuario.parceiro =
        parceiroId;

    parceiro.parceiro =
        userId;

    salvarDados();

}

// ======================================================
// DIVÓRCIO
// ======================================================

function divorciar(
    guildId,
    userId
) {

    const usuario =
        obterUsuario(
            guildId,
            userId
        );

    if (!usuario.parceiro) {
        return null;
    }

    const parceiroId =
        usuario.parceiro;

    const parceiro =
        obterUsuario(
            guildId,
            parceiroId
        );

    usuario.parceiro = null;
    parceiro.parceiro = null;

    salvarDados();

    return parceiroId;

}

// ======================================================
// PAINEL VIP E TICKETS
// ======================================================
async function enviarPainelVIP(guild) {
    const canal = await guild.channels.fetch(CANAL_VIP).catch(() => null);
    if (!canal || !canal.isTextBased()) return;

    const mensagens = await canal.messages.fetch({ limit: 50 }).catch(() => null);
    const painelExistente = mensagens?.find(m =>
        m.author.id === client.user.id &&
        m.embeds.some(e => e.title === '💎 LOJA VIP — RAVEN')
    );

    const embed = new EmbedBuilder()
        .setTitle('💎 LOJA VIP — RAVEN')
        .setDescription(`Escolha o VIP que deseja adquirir.

**💎 Prata** — 15.000 XP ou R$ 20
**🥇 Ouro** — 20.000 XP ou R$ 25
**💎 Diamante** — 30.000 XP ou R$ 35
**👑 Magnata** — 70.000 XP ou R$ 50
**🖤 Black** — 95.000 XP ou R$ 100
**✨ Legendery** — 140.000 XP ou R$ 145

Clique em um botão para abrir um ticket privado. Dentro do ticket você escolherá **XP ou Pix**.`)
        .setThumbnail(guild.iconURL({ extension: 'png', size: 256 }) || null)
        .setFooter({ text: 'Raven • Sistema VIP' })
        .setTimestamp();

    const row1 = new ActionRowBuilder().addComponents(
        ...['prata','ouro','diamante'].map(k => new ButtonBuilder().setCustomId(`vip_comprar_${k}`).setLabel(VIP_COMPRAS[k].nome).setEmoji(VIP_COMPRAS[k].emoji).setStyle(ButtonStyle.Primary))
    );
    const row2 = new ActionRowBuilder().addComponents(
        ...['magnata','black','legendary'].map(k => new ButtonBuilder().setCustomId(`vip_comprar_${k}`).setLabel(VIP_COMPRAS[k].nome).setEmoji(VIP_COMPRAS[k].emoji).setStyle(ButtonStyle.Secondary))
    );

    if (painelExistente) {
        await painelExistente.edit({ embeds: [embed], components: [row1, row2] });
    } else {
        await canal.send({ embeds: [embed], components: [row1, row2] });
    }
}

async function criarTicketVIP(interaction, chave) {
    const vip = VIP_COMPRAS[chave];
    if (!vip) return;
    const guild = interaction.guild;
    const existente = guild.channels.cache.find(c => c.topic === `vip-ticket:${interaction.user.id}`);
    if (existente) {
        return interaction.reply({ content: `❌ Você já possui um ticket VIP aberto: ${existente}`, ephemeral: true });
    }

    const categoria = await guild.channels.fetch(CATEGORIA_TICKETS).catch(() => null);
    if (!categoria) return interaction.reply({ content: '❌ A categoria de tickets não foi encontrada.', ephemeral: true });

    const nome = `vip-${chave}-${interaction.user.username.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 60)}`;
    const canal = await guild.channels.create({
        name: nome,
        type: ChannelType.GuildText,
        parent: categoria.id,
        topic: `vip-ticket:${interaction.user.id}`,
        permissionOverwrites: [
            { id: guild.roles.everyone.id, deny: ['ViewChannel'] },
            { id: interaction.user.id, allow: ['ViewChannel','SendMessages','ReadMessageHistory'] },
            { id: CARGO_SUPORTE, allow: ['ViewChannel','SendMessages','ReadMessageHistory','ManageMessages'] },
            { id: client.user.id, allow: ['ViewChannel','SendMessages','ReadMessageHistory','ManageChannels'] }
        ]
    });

    const embed = new EmbedBuilder()
        .setTitle(`🎫 Compra — ${vip.nome}`)
        .setDescription(`Olá ${interaction.user}!

Você escolheu **${vip.nome}**.

💎 **Preço em XP:** ${vip.xp.toLocaleString('pt-BR')} XP
💰 **Preço no Pix:** R$ ${vip.preco.toFixed(2).replace('.', ',')}

Escolha abaixo como deseja pagar.`)
        .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`vip_pagar_xp_${chave}`).setLabel('Pagar com XP').setEmoji('⭐').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`vip_pagar_pix_${chave}`).setLabel('Pagar com Pix').setEmoji('💳').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`vip_cancelar_${chave}`).setLabel('Cancelar').setEmoji('🗑️').setStyle(ButtonStyle.Danger)
    );

    await canal.send({ content: `${interaction.user} <@&${CARGO_SUPORTE}>`, embeds: [embed], components: [row] });
    await interaction.reply({ content: `✅ Seu ticket foi criado: ${canal}`, ephemeral: true });
}

async function entregarVIP(guild, userId, chave) {
    const vip = VIP_COMPRAS[chave];
    const member = await guild.members.fetch(userId);
    if (!member) throw new Error('Membro não encontrado.');
    const role = await guild.roles.fetch(vip.cargoId);
    if (!role) throw new Error('Cargo VIP não encontrado.');
    if (role.position >= guild.members.me.roles.highest.position) throw new Error('O cargo VIP está acima do cargo do bot.');
    await member.roles.add(role, `Compra ${vip.nome}`);
    iniciarContagemVip(guild.id, userId, chave);
    return role;
}

// ======================================================
// COMANDOS
// ======================================================

const comandos = [

    // ==================================================
    // VIP
    // ==================================================

    new SlashCommandBuilder()
        .setName('vip')
        .setDescription(
            'Gerencia sua call privada VIP e seu cargo personalizado.'
        )

        // ==================================================
        // CALL
        // ==================================================

        .addSubcommand(sub =>
            sub
                .setName('criar')
                .setDescription(
                    'Cria sua call privada VIP.'
                )
        )

        .addSubcommand(sub =>
            sub
                .setName('add')
                .setDescription(
                    'Adiciona uma pessoa à sua call.'
                )
                .addUserOption(o =>
                    o
                        .setName('usuario')
                        .setDescription(
                            'Pessoa que poderá entrar.'
                        )
                        .setRequired(true)
                )
        )

        .addSubcommand(sub =>
            sub
                .setName('remover')
                .setDescription(
                    'Remove uma pessoa da sua call.'
                )
                .addUserOption(o =>
                    o
                        .setName('usuario')
                        .setDescription(
                            'Pessoa que perderá o acesso.'
                        )
                        .setRequired(true)
                )
        )

        .addSubcommand(sub =>
            sub
                .setName('fechar')
                .setDescription(
                    'Fecha sua call VIP.'
                )
        )

        .addSubcommand(sub =>
            sub
                .setName('nomecal')
                .setDescription(
                    'Altera o nome da sua call.'
                )
                .addStringOption(o =>
                    o
                        .setName('nome')
                        .setDescription(
                            'Novo nome da call.'
                        )
                        .setRequired(true)
                        .setMaxLength(50)
                )
        )

        .addSubcommand(sub =>
            sub
                .setName('limite')
                .setDescription(
                    'Altera o limite de pessoas da call.'
                )
                .addIntegerOption(o =>
                    o
                        .setName('quantidade')
                        .setDescription(
                            '0 = sem limite.'
                        )
                        .setRequired(true)
                        .setMinValue(0)
                        .setMaxValue(99)
                )
        )

        .addSubcommand(sub =>
            sub
                .setName('bitrate')
                .setDescription(
                    'Altera o bitrate da sua call.'
                )
                .addIntegerOption(o =>
                    o
                        .setName('kbps')
                        .setDescription(
                            'Bitrate em kbps.'
                        )
                        .setRequired(true)
                        .setMinValue(8)
                        .setMaxValue(384)
                )
        )

        .addSubcommand(sub =>
            sub
                .setName('info')
                .setDescription(
                    'Mostra informações da sua call.'
                )
        )

        // ==================================================
        // CARGO PERSONALIZADO
        // ==================================================

        .addSubcommand(sub =>
            sub
                .setName('criarcargo')
                .setDescription(
                    'Cria seu cargo VIP personalizado.'
                )
                .addStringOption(o =>
                    o
                        .setName('nome')
                        .setDescription(
                            'Nome do seu cargo.'
                        )
                        .setRequired(true)
                        .setMaxLength(100)
                )
                .addStringOption(o =>
                    o
                        .setName('cor')
                        .setDescription(
                            'Cor HEX. Exemplo: #FF0000'
                        )
                        .setRequired(false)
                        .setMaxLength(7)
                )
                .addStringOption(o =>
                    o
                        .setName('emoji')
                        .setDescription(
                            'Emoji do cargo. Exemplo: 💎'
                        )
                        .setRequired(false)
                        .setMaxLength(20)
                )
        )

        .addSubcommand(sub =>
            sub
                .setName('editarcargo')
                .setDescription(
                    'Edita seu cargo VIP personalizado.'
                )
                .addStringOption(o =>
                    o
                        .setName('nome')
                        .setDescription(
                            'Novo nome do cargo.'
                        )
                        .setRequired(false)
                        .setMaxLength(100)
                )
                .addStringOption(o =>
                    o
                        .setName('cor')
                        .setDescription(
                            'Nova cor HEX. Exemplo: #FF0000'
                        )
                        .setRequired(false)
                        .setMaxLength(7)
                )
                .addStringOption(o =>
                    o
                        .setName('emoji')
                        .setDescription(
                            'Novo emoji do cargo.'
                        )
                        .setRequired(false)
                        .setMaxLength(20)
                )
                .addBooleanOption(o =>
                    o
                        .setName('mencionavel')
                        .setDescription(
                            'Permite mencionar o cargo.'
                        )
                        .setRequired(false)
                )
        )

        .addSubcommand(sub =>
            sub
                .setName('cargoadd')
                .setDescription(
                    'Entrega seu cargo personalizado a alguém.'
                )
                .addUserOption(o =>
                    o
                        .setName('usuario')
                        .setDescription(
                            'Pessoa que receberá seu cargo.'
                        )
                        .setRequired(true)
                )
        )

        .addSubcommand(sub =>
            sub
                .setName('cargoremover')
                .setDescription(
                    'Remove seu cargo personalizado de alguém.'
                )
                .addUserOption(o =>
                    o
                        .setName('usuario')
                        .setDescription(
                            'Pessoa que perderá seu cargo.'
                        )
                        .setRequired(true)
                )
        )

        .addSubcommand(sub =>
            sub
                .setName('cargoinfo')
                .setDescription(
                    'Mostra informações do seu cargo personalizado.'
                )
        )

        .addSubcommand(sub =>
            sub
                .setName('excluircargo')
                .setDescription(
                    'Exclui seu cargo personalizado.'
                )
        ),

    // ==================================================
    // INFO
    // ==================================================

    new SlashCommandBuilder()
        .setName('info')
        .setDescription(
            'Mostra os comandos que você pode usar.'
        ),

    // ==================================================
    // MODERAÇÃO
    // ==================================================

    new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Silencia um usuário.')
        .addUserOption(o =>
            o
                .setName('usuario')
                .setDescription('Usuário')
                .setRequired(true)
        )
        .addIntegerOption(o =>
            o
                .setName('minutos')
                .setDescription('Minutos')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(40320)
        ),

    new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Bane um usuário.')
        .addUserOption(o =>
            o
                .setName('usuario')
                .setDescription('Usuário')
                .setRequired(true)
        )
        .addStringOption(o =>
            o
                .setName('motivo')
                .setDescription('Motivo')
        ),

    new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Expulsa um usuário.')
        .addUserOption(o =>
            o
                .setName('usuario')
                .setDescription('Usuário')
                .setRequired(true)
        )
        .addStringOption(o =>
            o
                .setName('motivo')
                .setDescription('Motivo')
        ),

    new SlashCommandBuilder()
        .setName('cargo')
        .setDescription('Adiciona um cargo.')
        .addUserOption(o =>
            o
                .setName('usuario')
                .setDescription('Usuário')
                .setRequired(true)
        )
        .addRoleOption(o =>
            o
                .setName('cargo')
                .setDescription('Cargo')
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName('tirarcargo')
        .setDescription('Remove um cargo.')
        .addUserOption(o =>
            o
                .setName('usuario')
                .setDescription('Usuário')
                .setRequired(true)
        )
        .addRoleOption(o =>
            o
                .setName('cargo')
                .setDescription('Cargo')
                .setRequired(true)
        ),

    // ==================================================
    // CASTIGO
    // ==================================================

    new SlashCommandBuilder()
        .setName('castigo')
        .setDescription('Coloca um usuário de castigo.')
        .addUserOption(o =>
            o
                .setName('usuario')
                .setDescription('Usuário que receberá o castigo.')
                .setRequired(true)
        )
        .addIntegerOption(o =>
            o
                .setName('minutos')
                .setDescription('Duração do castigo em minutos.')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(40320)
        )
        .addStringOption(o =>
            o
                .setName('motivo')
                .setDescription('Motivo do castigo.')
                .setRequired(false)
                .setMaxLength(500)
        ),

    new SlashCommandBuilder()
        .setName('tirarcastigo')
        .setDescription('Remove o castigo de um usuário.')
        .addUserOption(o =>
            o
                .setName('usuario')
                .setDescription('Usuário que terá o castigo removido.')
                .setRequired(true)
        ),

    // ==================================================
    // SOCIAL
    // ==================================================

    new SlashCommandBuilder()
        .setName('casar')
        .setDescription('Pede alguém em casamento.')
        .addUserOption(o =>
            o
                .setName('usuario')
                .setDescription('Pessoa')
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName('divorcio')
        .setDescription('Termina seu casamento.'),

    new SlashCommandBuilder()
        .setName('beijo')
        .setDescription('Dá um beijo.')
        .addUserOption(o =>
            o
                .setName('usuario')
                .setDescription('Pessoa')
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName('abraco')
        .setDescription('Dá um abraço.')
        .addUserOption(o =>
            o
                .setName('usuario')
                .setDescription('Pessoa')
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName('carinho')
        .setDescription('Demonstra carinho.')
        .addUserOption(o =>
            o
                .setName('usuario')
                .setDescription('Pessoa')
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName('presente')
        .setDescription('Dá um presente.')
        .addUserOption(o =>
            o
                .setName('usuario')
                .setDescription('Pessoa')
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName('amizade')
        .setDescription('Cria uma amizade.')
        .addUserOption(o =>
            o
                .setName('usuario')
                .setDescription('Pessoa')
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName('tapa')
        .setDescription('Dá um tapa de brincadeira.')
        .addUserOption(o =>
            o
                .setName('usuario')
                .setDescription('Pessoa')
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName('gf')
        .setDescription(
            'Tenta fazer um GF com seu parceiro.'
        )
        .addUserOption(o =>
            o
                .setName('usuario')
                .setDescription('Pessoa')
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName('xcam')
        .setDescription(
            'Tenta fazer um XCAM com seu parceiro.'
        )
        .addUserOption(o =>
            o
                .setName('usuario')
                .setDescription('Pessoa')
                .setRequired(true)
        ),

    // ==================================================
    // PERFIL / XP
    // ==================================================

    new SlashCommandBuilder()
        .setName('perfil')
        .setDescription('Mostra um perfil.')
        .addUserOption(o =>
            o
                .setName('usuario')
                .setDescription('Usuário')
        ),

    new SlashCommandBuilder()
        .setName('relacionamento')
        .setDescription(
            'Mostra seu relacionamento.'
        ),

    new SlashCommandBuilder()
        .setName('ranking')
        .setDescription(
            'Mostra o ranking de XP.'
        ),

    new SlashCommandBuilder()
        .setName('xp')
        .setDescription('Mostra seu XP.'),

    new SlashCommandBuilder()
        .setName('viptime')
        .setDescription('Mostra há quanto tempo seu VIP está ativo e quando expira.'),

    new SlashCommandBuilder()
        .setName('castigo-status')
        .setDescription('Mostra quanto tempo falta do seu castigo.'),

    new SlashCommandBuilder()
        .setName('ajuda')
        .setDescription(
            'Mostra os comandos disponíveis.'
        ),

    new SlashCommandBuilder()
        .setName('limpar')
        .setDescription('Apaga mensagens.')
        .addIntegerOption(o =>
            o
                .setName('quantidade')
                .setDescription('Quantidade')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100)
        ),

    new SlashCommandBuilder()
        .setName('protecao')
        .setDescription(
            'Mostra o status da proteção.'
        )

    // ==================================================
    // ECONOMIA / DIVERSÃO / UTILIDADES
    // ==================================================

    new SlashCommandBuilder().setName('cl').setDescription('Apaga suas mensagens anteriores somente neste canal.').addIntegerOption(o => o.setName('quantidade').setDescription('Quantidade; deixe vazio para limpar o máximo possível.').setMinValue(1).setMaxValue(1000)),

    new SlashCommandBuilder().setName('addxp').setDescription('Adiciona XP a um usuário.').addUserOption(o => o.setName('usuario').setDescription('Usuário').setRequired(true)).addIntegerOption(o => o.setName('quantidade').setDescription('Quantidade de XP').setRequired(true).setMinValue(1).setMaxValue(1000000)),
    new SlashCommandBuilder().setName('removexp').setDescription('Remove XP de um usuário.').addUserOption(o => o.setName('usuario').setDescription('Usuário').setRequired(true)).addIntegerOption(o => o.setName('quantidade').setDescription('Quantidade de XP').setRequired(true).setMinValue(1).setMaxValue(1000000)),
    new SlashCommandBuilder().setName('saldo').setDescription('Mostra seu saldo de XP.'),
    new SlashCommandBuilder().setName('daily').setDescription('Resgata sua recompensa diária de XP.'),
    new SlashCommandBuilder().setName('work').setDescription('Trabalha e recebe XP.'),
    new SlashCommandBuilder().setName('transferir').setDescription('Transfere XP para outro usuário.').addUserOption(o => o.setName('usuario').setDescription('Destinatário').setRequired(true)).addIntegerOption(o => o.setName('quantidade').setDescription('XP').setRequired(true).setMinValue(1)),
    new SlashCommandBuilder().setName('loja').setDescription('Mostra a loja e os VIPs disponíveis.'),
    new SlashCommandBuilder().setName('comprar').setDescription('Compra um item da loja com XP.').addStringOption(o => o.setName('item').setDescription('Item').setRequired(true).addChoices(
        { name: 'VIP Prata', value: 'vip_prata' }, { name: 'VIP Ouro', value: 'vip_ouro' }, { name: 'VIP Diamante', value: 'vip_diamante' },
        { name: 'VIP Magnata', value: 'vip_magnata' }, { name: 'VIP Black', value: 'vip_black' }, { name: 'VIP Legendery', value: 'vip_legendary' }
    )),
    new SlashCommandBuilder().setName('inventario').setDescription('Mostra seu inventário.'),
    new SlashCommandBuilder().setName('ricos').setDescription('Mostra o ranking dos mais ricos em XP.'),
    new SlashCommandBuilder().setName('metas').setDescription('Mostra suas metas de XP e participação.'),

    new SlashCommandBuilder().setName('8ball').setDescription('Faça uma pergunta para a bola 8.').addStringOption(o => o.setName('pergunta').setDescription('Sua pergunta').setRequired(true).setMaxLength(200)),
    new SlashCommandBuilder().setName('caraoucoroa').setDescription('Joga cara ou coroa.'),
    new SlashCommandBuilder().setName('dados').setDescription('Rola dados.').addIntegerOption(o => o.setName('lados').setDescription('Quantidade de lados').setMinValue(2).setMaxValue(100)),
    new SlashCommandBuilder().setName('adivinha').setDescription('Tente adivinhar um número de 1 a 10.').addIntegerOption(o => o.setName('palpite').setDescription('Seu palpite').setRequired(true).setMinValue(1).setMaxValue(10)),
    new SlashCommandBuilder().setName('rankingdiversao').setDescription('Mostra o ranking de diversão.'),

    new SlashCommandBuilder().setName('vip-painel').setDescription('Envia/atualiza o painel de compras VIP no canal VIP.')

].map(c => c.toJSON());

// ======================================================
// BOT ONLINE
// ======================================================

client.once(
    'clientReady',
    async () => {

        carregarDados();

        for (const guild of client.guilds.cache.values()) {
            enviarPainelVIP(guild).catch(e => console.log('❌ Erro no painel VIP:', e));
        }

        console.log(
            `🤖 ${client.user.tag} está online!`
        );

        console.log(
            `💎 Canal VIP: ${CANAL_VIP}`
        );

        console.log(
            `🤖 Canal comandos: ${CANAL_COMANDOS}`
        );

        console.log(
            `🛡️ Canal moderação: ${CANAL_MODERACAO}`
        );

        try {

            const rest =
                new REST({
                    version: '10'
                }).setToken(
                    client.token
                );

            await rest.put(
                Routes.applicationCommands(
                    client.user.id
                ),
                {
                    body: comandos
                }
            );

            console.log(
                '✅ Comandos registrados!'
            );

            await verificarCastigosAtivos();
            await verificarVipsExpirados();

            console.log(
                '🔒 Castigos ativos verificados.'
            );
            console.log('💎 VIPs expirados verificados.');

        } catch (erro) {

            console.log(
                '❌ Erro ao registrar comandos:',
                erro
            );

        }

    }
);

// ======================================================
// VERIFICAR CASTIGOS AUTOMATICAMENTE
// ======================================================

setInterval(() => {

    verificarCastigosAtivos().catch(erro => {

        console.log(
            '❌ Erro ao verificar castigos:',
            erro
        );

    });

}, 15000);

// ======================================================
// VERIFICAR VIPs EXPIRADOS AUTOMATICAMENTE
// ======================================================

setInterval(() => {
    verificarVipsExpirados().catch(erro => {
        console.log('❌ Erro ao verificar VIPs expirados:', erro);
    });
}, 30000);

// ======================================================
// NOVO MEMBRO
// ======================================================

client.on(
    'guildMemberAdd',
    async member => {

        try {

            const guild = member.guild;

            const raidAtivo =
                servidorEmRaid(guild.id);

            const raidDetectado =
                registrarEvento(
                    entradasGuild,
                    guild.id,
                    PROTECAO.ativacaoRaid,
                    PROTECAO.janelaRaid
                );

            if (raidDetectado) {

                await ativarModoRaid(
                    guild,
                    'Muitas entradas em pouco tempo.'
                );

            }

            if (
                raidAtivo ||
                servidorEmRaid(guild.id)
            ) {

                await enviarLog(
                    guild,
                    '🛡️ Novo membro durante anti-raid',
                    `${member} entrou no servidor enquanto o modo de proteção estava ativo.`
                );

                await protegerMembro(
                    member,
                    'Proteção anti-raid: entrada durante ataque.'
                );

            }

        } catch (erro) {

            console.log(
                '❌ Erro no anti-raid de entrada:',
                erro
            );

        }

    }
);

// ======================================================
// CONTROLE AUTOMÁTICO DOS VIPs
// ======================================================

client.on('guildMemberUpdate', async (oldMember, newMember) => {
    try {
        if (!newMember.guild) return;

        const antes = obterVipAtualComChave(oldMember);
        const depois = obterVipAtualComChave(newMember);

        // VIP foi adicionado ou trocado manualmente.
        if (depois && (!antes || antes.chave !== depois.chave)) {
            iniciarContagemVip(newMember.guild.id, newMember.id, depois.chave);
            return;
        }

        // O último VIP foi removido. Não apaga o cargo VIP do servidor,
        // apenas remove do membro e limpa os recursos que ele criou.
        if (antes && !depois) {
            await removerRecursosVipDoUsuario(newMember.guild, newMember.id);
            await enviarLog(
                newMember.guild,
                '🧹 Recursos VIP removidos',
                `${newMember} perdeu o VIP **${antes.vip.nome}**. A call privada e o cargo personalizado criados pelo sistema foram excluídos, se existiam.`
            ).catch(() => null);
        }
    } catch (erro) {
        console.log('❌ Erro no controle automático do VIP:', erro);
    }
});

// ======================================================
// CRIAÇÃO DE CANAL
// ======================================================

client.on(
    'channelCreate',
    async channel => {

        try {

            if (!channel.guild) {
                return;
            }

            const detectado =
                registrarEvento(
                    canaisGuild,
                    channel.guild.id,
                    PROTECAO.limiteCanais,
                    PROTECAO.janelaCanais
                );

            if (detectado) {

                await ativarModoRaid(
                    channel.guild,
                    'Criação em massa de canais.'
                );

                await enviarLog(
                    channel.guild,
                    '🚨 Criação de canais em massa',
                    'Foram detectadas várias criações de canais em pouco tempo.'
                );

            }

        } catch (erro) {

            console.log(
                '❌ Erro ao detectar criação de canal:',
                erro
            );

        }

    }
);

// ======================================================
// EXCLUSÃO DE CANAL
// ======================================================

client.on(
    'channelDelete',
    async channel => {

        try {

            if (!channel.guild) {
                return;
            }

            const detectado =
                registrarEvento(
                    canaisGuild,
                    channel.guild.id,
                    PROTECAO.limiteCanais,
                    PROTECAO.janelaCanais
                );

            if (detectado) {

                await ativarModoRaid(
                    channel.guild,
                    'Exclusão em massa de canais.'
                );

                await enviarLog(
                    channel.guild,
                    '🚨 Exclusão de canais em massa',
                    'Foram detectadas várias exclusões de canais em pouco tempo.'
                );

            }

        } catch (erro) {

            console.log(
                '❌ Erro ao detectar exclusão de canal:',
                erro
            );

        }

    }
);

// ======================================================
// CRIAÇÃO DE CARGO
// ======================================================

client.on(
    'roleCreate',
    async role => {

        try {

            const detectado =
                registrarEvento(
                    cargosGuild,
                    role.guild.id,
                    PROTECAO.limiteCargos,
                    PROTECAO.janelaCargos
                );

            if (detectado) {

                await ativarModoRaid(
                    role.guild,
                    'Criação em massa de cargos.'
                );

                await enviarLog(
                    role.guild,
                    '🚨 Criação de cargos em massa',
                    'Foram detectadas várias criações de cargos em pouco tempo.'
                );

            }

        } catch (erro) {

            console.log(
                '❌ Erro ao detectar criação de cargo:',
                erro
            );

        }

    }
);

// ======================================================
// EXCLUSÃO DE CARGO
// ======================================================

client.on(
    'roleDelete',
    async role => {

        try {

            const detectado =
                registrarEvento(
                    cargosGuild,
                    role.guild.id,
                    PROTECAO.limiteCargos,
                    PROTECAO.janelaCargos
                );

            if (detectado) {

                await ativarModoRaid(
                    role.guild,
                    'Exclusão em massa de cargos.'
                );

                await enviarLog(
                    role.guild,
                    '🚨 Exclusão de cargos em massa',
                    'Foram detectadas várias exclusões de cargos em pouco tempo.'
                );

            }

        } catch (erro) {

            console.log(
                '❌ Erro ao detectar exclusão de cargo:',
                erro
            );

        }

    }
);

// ======================================================
// BANIMENTO
// ======================================================

client.on(
    'guildBanAdd',
    async ban => {

        try {

            const guild = ban.guild;

            const detectado =
                registrarEvento(
                    banimentosGuild,
                    guild.id,
                    PROTECAO.limiteBanimentos,
                    PROTECAO.janelaBanimentos
                );

            if (detectado) {

                await ativarModoRaid(
                    guild,
                    'Vários banimentos em pouco tempo.'
                );

                await enviarLog(
                    guild,
                    '🚨 Banimentos em massa',
                    'Foram detectados vários banimentos em pouco tempo.'
                );

            }

        } catch (erro) {

            console.log(
                '❌ Erro ao detectar banimentos:',
                erro
            );

        }

    }
);

// ======================================================
// INTERAÇÕES
// ======================================================

client.on(
    'interactionCreate',
    async interaction => {

        try {

            if (!interaction.guild) return;

            // ==================================================
            // BOTÕES VIP / TICKETS
            // ==================================================
            if (interaction.isButton()) {
                const id = interaction.customId;

                if (id.startsWith('vip_comprar_')) {
                    return criarTicketVIP(interaction, id.replace('vip_comprar_', ''));
                }

                if (id.startsWith('vip_pagar_xp_')) {
                    const chave = id.replace('vip_pagar_xp_', '');
                    const vip = VIP_COMPRAS[chave];
                    if (!vip) return interaction.reply({ content: '❌ VIP inválido.', ephemeral: true });
                    if (obterSaldoXP(interaction.guild.id, interaction.user.id) < vip.xp) return interaction.reply({ content: `❌ Você precisa de **${vip.xp.toLocaleString('pt-BR')} XP**. Seu saldo é **${obterSaldoXP(interaction.guild.id, interaction.user.id).toLocaleString('pt-BR')} XP**.`, ephemeral: true });
                    if (!gastarXP(interaction.guild.id, interaction.user.id, vip.xp)) return interaction.reply({ content: '❌ Não foi possível descontar seu XP.', ephemeral: true });
                    try {
                        const role = await entregarVIP(interaction.guild, interaction.user.id, chave);
                        await interaction.reply({ content: `✅ Compra aprovada! Você recebeu ${role}. **${vip.xp.toLocaleString('pt-BR')} XP** foram descontados.`, ephemeral: false });
                        await enviarLog(interaction.guild, '💎 VIP comprado com XP', `${interaction.user} comprou ${vip.nome} por ${vip.xp} XP.`);
                    } catch (e) {
                        adicionarXP(interaction.guild.id, interaction.user.id, vip.xp);
                        return interaction.reply({ content: `❌ Não consegui entregar o VIP. Seu XP foi devolvido.
${e.message}`, ephemeral: true });
                    }
                    setTimeout(() => interaction.channel.delete('Ticket VIP concluído').catch(() => null), 5000);
                    return;
                }

                if (id.startsWith('vip_pagar_pix_')) {
                    const chave = id.replace('vip_pagar_pix_', '');
                    const vip = VIP_COMPRAS[chave];
                    return interaction.reply({ content: `💳 **Pagamento via Pix — ${vip.nome}**

Valor: **R$ ${vip.preco.toFixed(2).replace('.', ',')}**
Chave Pix: \`${🔑 A chave Pix será enviada manualmente pela equipe depois que um atendente assumir este ticket.}\`

Depois de pagar, envie o comprovante neste ticket e aguarde a equipe.`, components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`vip_aprovar_pix_${chave}`).setLabel('Aprovar Pix (Equipe)').setEmoji('✅').setStyle(ButtonStyle.Success))] });
                }

                if (id.startsWith('vip_aprovar_pix_')) {
                    if (!interaction.member.roles.cache.has(CARGO_SUPORTE) && !interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) return interaction.reply({ content: '❌ Apenas a equipe pode aprovar pagamentos.', ephemeral: true });
                    const chave = id.replace('vip_aprovar_pix_', '');
                    const vip = VIP_COMPRAS[chave];
                    const ticketUserId = interaction.channel?.topic?.replace('vip-ticket:', '');
                    if (!ticketUserId) return interaction.reply({ content: '❌ Não consegui identificar o comprador.', ephemeral: true });
                    try {
                        const role = await entregarVIP(interaction.guild, ticketUserId, chave);
                        await interaction.reply({ content: `✅ Pagamento aprovado. ${role} entregue a <@${ticketUserId}>.` });
                        await enviarLog(interaction.guild, '💳 VIP comprado via Pix', `${interaction.user} aprovou ${vip.nome} para <@${ticketUserId}>.`);
                        setTimeout(() => interaction.channel.delete('Ticket VIP concluído').catch(() => null), 5000);
                    } catch (e) { return interaction.reply({ content: `❌ Erro: ${e.message}`, ephemeral: true }); }
                    return;
                }

                if (id.startsWith('vip_cancelar_')) {
                    await interaction.reply({ content: '🗑️ Ticket encerrado.', ephemeral: true });
                    setTimeout(() => interaction.channel.delete('Ticket VIP cancelado').catch(() => null), 1500);
                    return;
                }
                return;
            }

            if (!interaction.isChatInputCommand()) return;

            const comando = interaction.commandName;

            if (comando === 'vip-painel') {
                if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) return interaction.reply({ content: '❌ Você precisa da permissão Gerenciar Servidor.', ephemeral: true });
                await enviarPainelVIP(interaction.guild);
                return interaction.reply({ content: `✅ Painel VIP enviado/verificado em <#${CANAL_VIP}>.`, ephemeral: true });
            }

            // ==================================================
            // VERIFICAR CANAL
            // ==================================================

            const verificacao =
                verificarCanalComando(
                    interaction
                );

            if (!verificacao.permitido) {

                return interaction.reply({
                    content:
                        verificacao.mensagem,
                    ephemeral: true
                });

            }

            // ==================================================
            // /CL — LIMPAR APENAS AS MENSAGENS DO AUTOR NESTE CANAL
            // ==================================================
            if (comando === 'cl') {
                if (!interaction.channel?.isTextBased()) return interaction.reply({ content: '❌ Este comando precisa ser usado em um canal de texto.', ephemeral: true });
                if (!interaction.channel.permissionsFor(interaction.guild.members.me).has(PermissionsBitField.Flags.ManageMessages)) return interaction.reply({ content: '❌ Preciso da permissão Gerenciar Mensagens neste canal.', ephemeral: true });
                const quantidade = interaction.options.getInteger('quantidade');
                await interaction.reply({ content: '🧹 Limpando suas mensagens neste canal...', ephemeral: true });
                let restantes = quantidade || Infinity;
                let antesDe = null;
                let apagadas = 0;
                while (restantes > 0) {
                    const lote = await interaction.channel.messages.fetch({ limit: 100, ...(antesDe ? { before: antesDe } : {}) }).catch(() => null);
                    if (!lote || lote.size === 0) break;
                    const minhas = [...lote.values()].filter(m => m.author.id === interaction.user.id && m.id !== interaction.id).slice(0, restantes === Infinity ? 100 : restantes);
                    for (const msg of minhas) {
                        await msg.delete().then(() => apagadas++).catch(() => null);
                        if (restantes !== Infinity) restantes--;
                    }
                    antesDe = lote.last().id;
                    if (lote.size < 100 || (quantidade && restantes <= 0)) break;
                }
                return interaction.editReply(`🧹 Foram apagadas **${apagadas}** mensagens suas neste canal.`);
            }

            // ==================================================
            // /VIPTIME
            // ==================================================
            if (comando === 'viptime') {
                const member = await interaction.guild.members.fetch(interaction.user.id);
                const atual = obterVipAtualComChave(member);
                if (!atual) {
                    return interaction.reply({ content: '❌ Você não possui um VIP ativo.', ephemeral: true });
                }

                const usuario = obterUsuario(interaction.guild.id, interaction.user.id);
                const registro = obterRegistroVip(usuario);
                if (!registro.inicio || !registro.fim || registro.chave !== atual.chave) {
                    iniciarContagemVip(interaction.guild.id, interaction.user.id, atual.chave);
                }

                const atualizado = obterRegistroVip(obterUsuario(interaction.guild.id, interaction.user.id));
                const diasPassados = Math.max(0, Math.floor((Date.now() - atualizado.inicio) / 86400000));
                const diasRestantes = Math.max(0, Math.ceil((atualizado.fim - Date.now()) / 86400000));
                return interaction.reply({ embeds: [new EmbedBuilder()
                    .setTitle(`⏳ ${atual.vip.nome}`)
                    .setDescription(`Seu VIP está ativo por **30 dias**.`)
                    .addFields(
                        { name: '📅 Contratado em', value: `<t:${Math.floor(atualizado.inicio / 1000)}:F>`, inline: false },
                        { name: '⏱️ Ativo há', value: `**${diasPassados} dia(s)**`, inline: true },
                        { name: '⌛ Expira em', value: `**${diasRestantes} dia(s)**`, inline: true },
                        { name: '🗓️ Expiração', value: `<t:${Math.floor(atualizado.fim / 1000)}:F>`, inline: false }
                    )
                    .setTimestamp()] });
            }

            // ==================================================
            // ECONOMIA
            // ==================================================
            if (['saldo','daily','work','transferir','loja','comprar','inventario','ricos','metas'].includes(comando)) {
                const user = obterUsuario(interaction.guild.id, interaction.user.id);
                if (comando === 'saldo') return interaction.reply(`💰 Seu saldo: **${obterSaldoXP(interaction.guild.id, interaction.user.id).toLocaleString('pt-BR')} XP**
⭐ Nível: **${user.nivel}**`);
                if (comando === 'daily') {
                    const agora = Date.now(); const cd = 24*60*60*1000;
                    if (agora - user.ultimoDaily < cd) return interaction.reply({ content: `⏳ Você já pegou sua recompensa diária. Volte <t:${Math.floor((user.ultimoDaily+cd)/1000)}:R>.`, ephemeral: true });
                    user.ultimoDaily = agora; adicionarXP(interaction.guild.id, interaction.user.id, 500); return interaction.reply('🎁 **Daily resgatada!** Você recebeu **500 XP**.');
                }
                if (comando === 'work') {
                    const agora = Date.now(); const cd = 60*60*1000;
                    if (agora - user.ultimoWork < cd) return interaction.reply({ content: `⏳ Você já trabalhou. Tente novamente <t:${Math.floor((user.ultimoWork+cd)/1000)}:R>.`, ephemeral: true });
                    const ganho = Math.floor(Math.random()*201)+100; user.ultimoWork=agora; adicionarXP(interaction.guild.id, interaction.user.id, ganho); return interaction.reply(`💼 Você trabalhou e recebeu **${ganho} XP**!`);
                }
                if (comando === 'transferir') {
                    const alvo=interaction.options.getUser('usuario'); const qtd=interaction.options.getInteger('quantidade');
                    if (alvo.bot || alvo.id===interaction.user.id) return interaction.reply({ content:'❌ Escolha outro membro que não seja bot.', ephemeral:true });
                    if (!gastarXP(interaction.guild.id, interaction.user.id, qtd)) return interaction.reply({ content:'❌ Você não possui XP suficiente.', ephemeral:true });
                    adicionarXP(interaction.guild.id, alvo.id, qtd); return interaction.reply(`💸 ${interaction.user} transferiu **${qtd.toLocaleString('pt-BR')} XP** para ${alvo}.`);
                }
                if (comando === 'loja') return interaction.reply({ embeds:[new EmbedBuilder().setTitle('🛒 Loja Raven').setDescription(Object.values(VIP_COMPRAS).map(v=>`${v.emoji} **${v.nome}** — ${v.xp.toLocaleString('pt-BR')} XP / R$ ${v.preco.toFixed(2).replace('.',',')}`).join('\n')).addFields({name:'Como comprar',value:'Use `/comprar item` para compra direta com XP ou use o painel VIP para abrir um ticket e escolher XP/Pix.'})] });
                if (comando === 'comprar') {
                    const item=interaction.options.getString('item').replace('vip_',''); const vip=VIP_COMPRAS[item];
                    if (!vip) return interaction.reply({content:'❌ Item inválido.',ephemeral:true});
                    if (!gastarXP(interaction.guild.id, interaction.user.id, vip.xp)) return interaction.reply({content:`❌ Você precisa de ${vip.xp.toLocaleString('pt-BR')} XP.`,ephemeral:true});
                    try { const role=await entregarVIP(interaction.guild, interaction.user.id, item); return interaction.reply(`✅ Você comprou ${role} por **${vip.xp.toLocaleString('pt-BR')} XP**!`); } catch(e) { adicionarXP(interaction.guild.id, interaction.user.id, vip.xp); return interaction.reply({content:`❌ Compra cancelada: ${e.message}`,ephemeral:true}); }
                }
                if (comando === 'inventario') { const inv=user.inventario.length?user.inventario.map(x=>`• ${x}`).join('\n'):'Seu inventário está vazio.'; return interaction.reply(`🎒 **Inventário de ${interaction.user.username}**\n\n${inv}`); }
                if (comando === 'ricos') { const ranking=Object.entries(dados[interaction.guild.id]||{}).map(([id,u])=>({id,xp:u?.xpTotal||0})).sort((a,b)=>b.xp-a.xp).slice(0,10); return interaction.reply('🏆 **Mais ricos em XP**\n'+(ranking.map((r,i)=>`${i+1}. <@${r.id}> — **${r.xp.toLocaleString('pt-BR')} XP**`).join('\n')||'Ninguém ainda.')); }
                if (comando === 'metas') { const metas=[1000,5000,15000,30000,70000,100000,150000]; const saldo=obterSaldoXP(interaction.guild.id,interaction.user.id); const linhas=metas.map(m=>`${saldo>=m?'✅':'⬜'} ${m.toLocaleString('pt-BR')} XP${saldo>=m?' — concluída':''}`).join('\n'); return interaction.reply(`🎯 **Metas do servidor**\n\n${linhas}\n\n💡 Continue participando, conversando e usando os sistemas para ganhar XP.`); }
            }

            // ==================================================
            // DIVERSÃO
            // ==================================================
            if (['8ball','caraoucoroa','dados','adivinha','rankingdiversao'].includes(comando)) {
                const user=obterUsuario(interaction.guild.id,interaction.user.id);
                if (comando==='8ball') { user.pontosDiversao+=5; salvarDados(); return interaction.reply(`🎱 ${respostas8Ball[Math.floor(Math.random()*respostas8Ball.length)]}`); }
                if (comando==='caraoucoroa') { user.pontosDiversao+=5; salvarDados(); return interaction.reply(`🪙 Caiu **${Math.random()<0.5?'Cara':'Coroa'}**!`); }
                if (comando==='dados') { const lados=interaction.options.getInteger('lados')||6; user.pontosDiversao+=5; salvarDados(); return interaction.reply(`🎲 Você rolou um d${lados}: **${Math.floor(Math.random()*lados)+1}**`); }
                if (comando==='adivinha') { const palpite=interaction.options.getInteger('palpite'); if (!user.adivinha) user.adivinha=Math.floor(Math.random()*10)+1; if(palpite===user.adivinha){ user.pontosDiversao+=25; user.adivinha=null; adicionarXP(interaction.guild.id,interaction.user.id,100); return interaction.reply('🎉 **Acertou!** Você ganhou **100 XP** e 25 pontos de diversão.'); } user.pontosDiversao+=1; salvarDados(); return interaction.reply(`❌ Errou! O número continua entre 1 e 10. Tente novamente.`); }
                if (comando==='rankingdiversao') { const ranking=Object.entries(dados[interaction.guild.id]||{}).map(([id,u])=>({id,p:u?.pontosDiversao||0})).sort((a,b)=>b.p-a.p).slice(0,10); return interaction.reply('🎮 **Ranking de diversão**\n'+(ranking.map((r,i)=>`${i+1}. <@${r.id}> — **${r.p} pontos**`).join('\n')||'Ninguém ainda.')); }
            }

            // ==================================================
            // ADDXP / REMOVEXP
            // ==================================================
            if (comando === 'addxp' || comando === 'removexp') {
                if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) return interaction.reply({content:'❌ Você precisa da permissão Gerenciar Servidor.',ephemeral:true});
                const alvo=interaction.options.getUser('usuario'); const qtd=interaction.options.getInteger('quantidade');
                if(comando==='addxp'){ adicionarXP(interaction.guild.id,alvo.id,qtd); return interaction.reply(`⭐ ${alvo} recebeu **${qtd.toLocaleString('pt-BR')} XP**.`); }
                if(!gastarXP(interaction.guild.id,alvo.id,qtd)) { const atual=obterSaldoXP(interaction.guild.id,alvo.id); gastarXP(interaction.guild.id,alvo.id,atual); return interaction.reply(`⭐ ${alvo} perdeu **${atual.toLocaleString('pt-BR')} XP** (não possuía ${qtd.toLocaleString('pt-BR')}).`); }
                return interaction.reply(`⭐ Foram removidos **${qtd.toLocaleString('pt-BR')} XP** de ${alvo}.`);
            }

            // ==================================================
            // SISTEMA VIP
            // ==================================================

            if (comando === 'vip') {

                const subcomando =
                    interaction.options.getSubcommand();

                const member =
                    await interaction.guild.members.fetch(
                        interaction.user.id
                    );

                const vip =
                    obterVipDoMembro(member);

                if (!vip) {

                    return interaction.reply({
                        content:
                            '❌ Você não possui um cargo VIP válido para usar esse sistema.',
                        ephemeral: true
                    });

                }

                // ==================================================
                // CRIAR CALL
                // ==================================================

                if (
                    subcomando === 'criar'
                ) {

                    const resultado =
                        await criarCallVIP(
                            interaction.guild,
                            member,
                            vip
                        );

                    if (!resultado.criada) {

                        return interaction.reply({
                            content:
                                `ℹ️ Você já possui uma call VIP: <#${resultado.canal.id}>`,
                            ephemeral: true
                        });

                    }

                    return interaction.reply({
                        content:
                            `✅ Sua call **${vip.nome}** foi criada em <#${resultado.canal.id}>.\n\n` +
                            `🔒 Ela é privada e somente você poderá liberar outras pessoas.`,
                        ephemeral: true
                    });

                }

                // ==================================================
                // CRIAR CARGO PERSONALIZADO
                // ==================================================

                if (
                    subcomando === 'criarcargo'
                ) {

                    if (
                        !podeCriarCargoPersonalizado(vip)
                    ) {

                        return interaction.reply({
                            content:
                                '❌ Apenas VIP **Diamond, Magnata, Black e Legendary** podem criar um cargo personalizado.',
                            ephemeral: true
                        });

                    }

                    const nome =
                        interaction.options.getString(
                            'nome'
                        );

                    const cor =
                        interaction.options.getString(
                            'cor'
                        );

                    const emoji =
                        interaction.options.getString(
                            'emoji'
                        );

                    if (
                        cor &&
                        !validarCorHex(cor)
                    ) {

                        return interaction.reply({
                            content:
                                '❌ A cor precisa estar em HEX. Exemplo: `#FF0000`.',
                            ephemeral: true
                        });

                    }

                    const resultado =
                        await criarCargoPersonalizado(
                            interaction.guild,
                            member,
                            vip,
                            nome,
                            cor,
                            emoji
                        );

                    if (!resultado.criado) {

                        return interaction.reply({
                            content:
                                `ℹ️ Você já possui um cargo personalizado: ${resultado.cargo}`,
                            ephemeral: true
                        });

                    }

                    return interaction.reply({
                        content:
                            `👑 Seu cargo personalizado foi criado com sucesso!\n\n` +
                            `🏷️ **Cargo:** ${resultado.cargo}\n` +
                            `💎 **VIP:** ${vip.nome}\n\n` +
                            `🔊 Se você já possuir uma call VIP, o cargo também recebeu acesso a ela.\n\n` +
                            `✏️ Você pode editar usando \`/vip editarcargo\`.\n` +
                            `👥 Você pode entregar usando \`/vip cargoadd\`.\n` +
                            `📢 O cargo pode ser mencionado.`,
                        ephemeral: true
                    });

                }

                // ==================================================
                // EDITAR CARGO
                // ==================================================

                if (
                    subcomando === 'editarcargo'
                ) {

                    if (
                        !podeCriarCargoPersonalizado(vip)
                    ) {

                        return interaction.reply({
                            content:
                                '❌ Apenas VIP **Diamond, Magnata, Black e Legendary** podem usar o cargo personalizado.',
                            ephemeral: true
                        });

                    }

                    const cargo =
                        await obterCargoPersonalizado(
                            interaction.guild,
                            member.id
                        );

                    if (!cargo) {

                        return interaction.reply({
                            content:
                                '❌ Você ainda não possui um cargo personalizado. Use `/vip criarcargo` primeiro.',
                            ephemeral: true
                        });

                    }

                    const nome =
                        interaction.options.getString(
                            'nome'
                        );

                    const cor =
                        interaction.options.getString(
                            'cor'
                        );

                    const emoji =
                        interaction.options.getString(
                            'emoji'
                        );

                    const mencionavel =
                        interaction.options.getBoolean(
                            'mencionavel'
                        );

                    if (
                        cor &&
                        !validarCorHex(cor)
                    ) {

                        return interaction.reply({
                            content:
                                '❌ A cor precisa estar em HEX. Exemplo: `#FF0000`.',
                            ephemeral: true
                        });

                    }

                    const opcoes = {};

                    if (nome) {

                        opcoes.name =
                            limparNomeCargo(nome);

                    }

                    if (cor) {

                        opcoes.color =
                            normalizarCor(cor);

                    }

                    if (emoji !== null) {

                        opcoes.unicodeEmoji =
                            limparEmoji(emoji);

                    }

                    if (
                        mencionavel !== null
                    ) {

                        opcoes.mentionable =
                            mencionavel;

                    }

                    if (
                        Object.keys(opcoes).length === 0
                    ) {

                        return interaction.reply({
                            content:
                                '❌ Você precisa informar pelo menos uma coisa para alterar: **nome, cor, emoji ou mencionável**.',
                            ephemeral: true
                        });

                    }

                    try {

                        await cargo.edit(
                            opcoes,
                            `Cargo VIP personalizado editado por ${interaction.user.tag}`
                        );

                    } catch (erro) {

                        console.log(
                            '❌ Erro ao editar cargo personalizado:',
                            erro
                        );

                        return interaction.reply({
                            content:
                                '❌ Não consegui editar o cargo. Verifique se o cargo do bot está acima dele na hierarquia.',
                            ephemeral: true
                        });

                    }

                    const usuario =
                        obterUsuario(
                            interaction.guild.id,
                            member.id
                        );

                    usuario.vipCargoNome =
                        cargo.name;

                    usuario.vipCargoEmoji =
                        cargo.unicodeEmoji || null;

                    usuario.vipCargoCor =
                        cargo.hexColor;

                    salvarDados();

                    return interaction.reply({
                        content:
                            `✅ Seu cargo foi atualizado!\n\n` +
                            `🏷️ **Nome:** ${cargo.name}\n` +
                            `🎨 **Cor:** ${cargo.hexColor}\n` +
                            `😀 **Emoji:** ${cargo.unicodeEmoji || 'Nenhum'}\n` +
                            `📢 **Mencionável:** ${cargo.mentionable ? 'Sim' : 'Não'}`,
                        ephemeral: true
                    });

                }

                // ==================================================
                // DAR CARGO A OUTRA PESSOA
                // ==================================================

                if (
                    subcomando === 'cargoadd'
                ) {

                    if (
                        !podeCriarCargoPersonalizado(vip)
                    ) {

                        return interaction.reply({
                            content:
                                '❌ Apenas VIP **Diamond, Magnata, Black e Legendary** podem usar o cargo personalizado.',
                            ephemeral: true
                        });

                    }

                    const alvo =
                        interaction.options.getMember(
                            'usuario'
                        );

                    if (!alvo) {

                        return interaction.reply({
                            content:
                                '❌ Usuário não encontrado.',
                            ephemeral: true
                        });

                    }

                    if (alvo.user.bot) {

                        return interaction.reply({
                            content:
                                '❌ Você não pode entregar seu cargo personalizado para um bot.',
                            ephemeral: true
                        });

                    }

                    if (
                        alvo.id ===
                        member.id
                    ) {

                        return interaction.reply({
                            content:
                                'ℹ️ Você já possui seu próprio cargo personalizado.',
                            ephemeral: true
                        });

                    }

                    const cargo =
                        await obterCargoPersonalizado(
                            interaction.guild,
                            member.id
                        );

                    if (!cargo) {

                        return interaction.reply({
                            content:
                                '❌ Você ainda não possui um cargo personalizado. Use `/vip criarcargo` primeiro.',
                            ephemeral: true
                        });

                    }

                    try {

                        await adicionarCargoPersonalizado(
                            interaction.guild,
                            member.id,
                            alvo
                        );

                    } catch (erro) {

                        console.log(
                            '❌ Erro ao entregar cargo personalizado:',
                            erro
                        );

                        return interaction.reply({
                            content:
                                `❌ Não consegui entregar o cargo.\n\n${erro.message}`,
                            ephemeral: true
                        });

                    }

                    return interaction.reply({
                        content:
                            `✅ ${alvo} recebeu seu cargo personalizado ${cargo}!\n\n` +
                            `🔊 Essa pessoa também possui acesso à sua call VIP enquanto estiver com o cargo.`,
                        ephemeral: true
                    });

                }

                // ==================================================
                // REMOVER CARGO DE OUTRA PESSOA
                // ==================================================

                if (
                    subcomando === 'cargoremover'
                ) {

                    if (
                        !podeCriarCargoPersonalizado(vip)
                    ) {

                        return interaction.reply({
                            content:
                                '❌ Apenas VIP **Diamond, Magnata, Black e Legendary** podem usar o cargo personalizado.',
                            ephemeral: true
                        });

                    }

                    const alvo =
                        interaction.options.getMember(
                            'usuario'
                        );

                    if (!alvo) {

                        return interaction.reply({
                            content:
                                '❌ Usuário não encontrado.',
                            ephemeral: true
                        });

                    }

                    const cargo =
                        await obterCargoPersonalizado(
                            interaction.guild,
                            member.id
                        );

                    if (!cargo) {

                        return interaction.reply({
                            content:
                                '❌ Você ainda não possui um cargo personalizado.',
                            ephemeral: true
                        });

                    }

                    if (
                        !alvo.roles.cache.has(
                            cargo.id
                        )
                    ) {

                        return interaction.reply({
                            content:
                                'ℹ️ Essa pessoa não possui seu cargo personalizado.',
                            ephemeral: true
                        });

                    }

                    try {

                        await removerCargoPersonalizado(
                            interaction.guild,
                            member.id,
                            alvo
                        );

                    } catch (erro) {

                        console.log(
                            '❌ Erro ao remover cargo personalizado:',
                            erro
                        );

                        return interaction.reply({
                            content:
                                `❌ Não consegui remover o cargo.\n\n${erro.message}`,
                            ephemeral: true
                        });

                    }

                    return interaction.reply({
                        content:
                            `✅ O cargo ${cargo} foi removido de ${alvo}.\n\n` +
                            `🔒 O acesso dessa pessoa à sua call continua controlado pelas permissões da call.`,
                        ephemeral: true
                    });

                }

                // ==================================================
                // INFORMAÇÕES DO CARGO
                // ==================================================

                if (
                    subcomando === 'cargoinfo'
                ) {

                    if (
                        !podeCriarCargoPersonalizado(vip)
                    ) {

                        return interaction.reply({
                            content:
                                '❌ Apenas VIP **Diamond, Magnata, Black e Legendary** possuem cargo personalizado.',
                            ephemeral: true
                        });

                    }

                    const cargo =
                        await obterCargoPersonalizado(
                            interaction.guild,
                            member.id
                        );

                    if (!cargo) {

                        return interaction.reply({
                            content:
                                '❌ Você ainda não possui um cargo personalizado.',
                            ephemeral: true
                        });

                    }

                    const membros =
                        cargo.members.size;

                    const embed =
                        new EmbedBuilder()
                            .setTitle(
                                '👑 Seu Cargo VIP Personalizado'
                            )
                            .setDescription(
                                `🏷️ **Nome:** ${cargo.name}\n` +
                                `🎨 **Cor:** ${cargo.hexColor}\n` +
                                `😀 **Emoji:** ${cargo.unicodeEmoji || 'Nenhum'}\n` +
                                `📢 **Mencionável:** ${cargo.mentionable ? 'Sim' : 'Não'}\n` +
                                `👥 **Pessoas com o cargo:** ${membros}\n` +
                                `💎 **VIP:** ${vip.nome}`
                            )
                            .setTimestamp();

                    return interaction.reply({
                        embeds: [embed],
                        ephemeral: true
                    });

                }

                // ==================================================
                // EXCLUIR CARGO
                // ==================================================

                if (
                    subcomando === 'excluircargo'
                ) {

                    if (
                        !podeCriarCargoPersonalizado(vip)
                    ) {

                        return interaction.reply({
                            content:
                                '❌ Apenas VIP **Diamond, Magnata, Black e Legendary** podem usar o cargo personalizado.',
                            ephemeral: true
                        });

                    }

                    const cargo =
                        await obterCargoPersonalizado(
                            interaction.guild,
                            member.id
                        );

                    if (!cargo) {

                        return interaction.reply({
                            content:
                                '❌ Você não possui um cargo personalizado.',
                            ephemeral: true
                        });

                    }

                    await excluirCargoPersonalizado(
                        interaction.guild,
                        member.id
                    );

                    return interaction.reply({
                        content:
                            '🗑️ Seu cargo personalizado foi excluído com sucesso.',
                        ephemeral: true
                    });

                }

                // ==================================================
                // PEGAR CALL
                // ==================================================

                const canal =
                    await obterCallDoDono(
                        interaction.guild,
                        member.id
                    );

                if (!canal) {

                    return interaction.reply({
                        content:
                            '❌ Você ainda não possui uma call VIP. Use `/vip criar` primeiro.',
                        ephemeral: true
                    });

                }

                // ==================================================
                // ADD
                // ==================================================

                if (
                    subcomando === 'add'
                ) {

                    const alvo =
                        interaction.options.getMember(
                            'usuario'
                        );

                    if (!alvo) {

                        return interaction.reply({
                            content:
                                '❌ Usuário não encontrado.',
                            ephemeral: true
                        });

                    }

                    if (alvo.user.bot) {

                        return interaction.reply({
                            content:
                                '❌ Você não pode adicionar bots à sua call.',
                            ephemeral: true
                        });

                    }

                    await canal.permissionOverwrites.edit(
                        alvo.id,
                        {
                            ViewChannel: true,
                            Connect: true,
                            Speak: true,
                            Stream: true,
                            UseVAD: true
                        }
                    );

                    return interaction.reply({
                        content:
                            `✅ ${alvo} agora pode entrar na sua call <#${canal.id}>.`,
                        ephemeral: true
                    });

                }

                // ==================================================
                // REMOVER
                // ==================================================

                if (
                    subcomando === 'remover'
                ) {

                    const alvo =
                        interaction.options.getMember(
                            'usuario'
                        );

                    if (!alvo) {

                        return interaction.reply({
                            content:
                                '❌ Usuário não encontrado.',
                            ephemeral: true
                        });

                    }

                    if (
                        alvo.id ===
                        member.id
                    ) {

                        return interaction.reply({
                            content:
                                '❌ Você não pode remover a si mesmo da sua própria call.',
                            ephemeral: true
                        });

                    }

                    await canal.permissionOverwrites.delete(
                        alvo.id
                    ).catch(async () => {

                        await canal.permissionOverwrites.edit(
                            alvo.id,
                            {
                                ViewChannel: false,
                                Connect: false
                            }
                        );

                    });

                    return interaction.reply({
                        content:
                            `✅ ${alvo} perdeu o acesso à sua call <#${canal.id}>.`,
                        ephemeral: true
                    });

                }

                // ==================================================
                // FECHAR
                // ==================================================

                if (
                    subcomando === 'fechar'
                ) {

                    await fecharCallVIP(
                        interaction.guild,
                        member.id
                    );

                    return interaction.reply({
                        content:
                            '🗑️ Sua call VIP foi fechada.',
                        ephemeral: true
                    });

                }

                // ==================================================
                // NOME DA CALL
                // ==================================================

                if (
                    subcomando === 'nomecal'
                ) {

                    const novoNome =
                        interaction.options.getString(
                            'nome'
                        );

                    const nomeFinal =
                        limparNomeCall(
                            novoNome
                        );

                    try {

                        await canal.setName(
                            `🔒・${nomeFinal}`,
                            `Nome da call alterado por ${interaction.user.tag}`
                        );

                        return interaction.reply({
                            content:
                                `✅ O nome da sua call foi alterado para **${canal.name}**.`,
                            ephemeral: true
                        });

                    } catch (erro) {

                        console.log(
                            '❌ Erro ao alterar nome da call:',
                            erro
                        );

                        return interaction.reply({
                            content:
                                '❌ Não consegui alterar o nome da call. Verifique se o bot possui **Gerenciar Canais**.',
                            ephemeral: true
                        });

                    }

                }

                // ==================================================
                // LIMITE DA CALL
                // ==================================================

                if (
                    subcomando === 'limite'
                ) {

                    const quantidade =
                        interaction.options.getInteger(
                            'quantidade'
                        );

                    try {

                        await canal.setUserLimit(
                            quantidade,
                            `Limite alterado por ${interaction.user.tag}`
                        );

                        return interaction.reply({
                            content:
                                quantidade === 0
                                    ? '✅ Sua call agora está **sem limite de pessoas**.'
                                    : `✅ O limite da sua call foi alterado para **${quantidade} pessoa(s)**.`,
                            ephemeral: true
                        });

                    } catch (erro) {

                        console.log(
                            '❌ Erro ao alterar limite:',
                            erro
                        );

                        return interaction.reply({
                            content:
                                '❌ Não consegui alterar o limite da call.',
                            ephemeral: true
                        });

                    }

                }

                // ==================================================
                // BITRATE
                // ==================================================

                if (
                    subcomando === 'bitrate'
                ) {

                    const kbps =
                        interaction.options.getInteger(
                            'kbps'
                        );

                    try {

                        await canal.setBitrate(
                            kbps * 1000,
                            `Bitrate alterado por ${interaction.user.tag}`
                        );

                        return interaction.reply({
                            content:
                                `✅ O bitrate da sua call foi alterado para **${kbps} kbps**.`,
                            ephemeral: true
                        });

                    } catch (erro) {

                        console.log(
                            '❌ Erro ao alterar bitrate:',
                            erro
                        );

                        return interaction.reply({
                            content:
                                '❌ Não consegui alterar o bitrate. O servidor pode não permitir esse valor ou o bot pode não ter **Gerenciar Canais**.',
                            ephemeral: true
                        });

                    }

                }

                // ==================================================
                // INFO DA CALL
                // ==================================================

                if (
                    subcomando === 'info'
                ) {

                    const membrosNaCall =
                        canal.members.size;

                    const limite =
                        canal.userLimit === 0
                            ? 'Sem limite'
                            : `${canal.userLimit} pessoa(s)`;

                    const bitrate =
                        Math.round(
                            canal.bitrate / 1000
                        );

                    const categoria =
                        canal.parent
                            ? canal.parent.name
                            : 'Sem categoria';

                    const cargo =
                        await obterCargoPersonalizado(
                            interaction.guild,
                            member.id
                        );

                    const embed =
                        new EmbedBuilder()
                            .setTitle(
                                '💎 Informações da sua Call VIP'
                            )
                            .setDescription(
                                `🔊 **Call:** <#${canal.id}>\n` +
                                `💎 **VIP:** ${vip.nome}\n` +
                                `📁 **Categoria:** ${categoria}\n` +
                                `👥 **Pessoas:** ${membrosNaCall}\n` +
                                `🔢 **Limite:** ${limite}\n` +
                                `🎧 **Bitrate:** ${bitrate} kbps\n` +
                                `👑 **Cargo personalizado:** ${cargo ? cargo.toString() : 'Não criado'}`
                            )
                            .setTimestamp();

                    return interaction.reply({
                        embeds: [embed],
                        ephemeral: true
                    });

                }

            }

            // ==================================================
            // CONTADOR DE COMANDOS
            // ==================================================

            const autorDados =
                obterUsuario(
                    interaction.guild.id,
                    interaction.user.id
                );

            autorDados.comandos++;

            salvarDados();

            // ==================================================
            // INFO
            // ==================================================

            if (
                comando === 'info'
            ) {

                const member =
                    await interaction.guild.members.fetch(
                        interaction.user.id
                    );

                const vip =
                    obterVipDoMembro(member);

                let texto =
                    '📚 **COMANDOS DISPONÍVEIS PARA VOCÊ**\n\n';

                texto +=
                    '**👤 PERFIL / XP**\n' +
                    '`/perfil` — Mostra seu perfil.\n' +
                    '`/xp` — Mostra seu XP.\n' +
                    '`/viptime` — Mostra há quantos dias seu VIP está ativo e quando expira.\n' +
                    '`/ranking` — Mostra o ranking de XP.\n' +
                    '`/relacionamento` — Mostra seu relacionamento.\n\n';

                texto +=
                    '**❤️ SOCIAL**\n' +
                    '`/casar` — Casa com alguém.\n' +
                    '`/divorcio` — Termina seu relacionamento.\n' +
                    '`/beijo` — Dá um beijo.\n' +
                    '`/abraco` — Dá um abraço.\n' +
                    '`/carinho` — Demonstra carinho.\n' +
                    '`/presente` — Dá um presente.\n' +
                    '`/amizade` — Faz amizade.\n' +
                    '`/tapa` — Dá um tapa de brincadeira.\n' +
                    '`/gf` — Tenta fazer um GF.\n' +
                    '`/xcam` — Tenta fazer um XCAM.\n\n';

                if (vip) {

                    texto +=
                        `**💎 VIP — ${vip.nome.toUpperCase()}**\n` +
                        'Os comandos VIP estão disponíveis no canal VIP.\n\n';

                    if (
                        podeCriarCargoPersonalizado(vip)
                    ) {

                        texto +=
                            '**👑 CARGO PERSONALIZADO VIP**\n' +
                            '`/vip criarcargo` — Cria seu cargo personalizado.\n' +
                            '`/vip editarcargo` — Edita nome, cor, emoji e menção.\n' +
                            '`/vip cargoadd` — Dá seu cargo para alguém.\n' +
                            '`/vip cargoremover` — Retira seu cargo de alguém.\n' +
                            '`/vip cargoinfo` — Mostra informações do cargo.\n' +
                            '`/vip excluircargo` — Exclui seu cargo.\n\n';

                    }

                } else {

                    texto +=
                        '**💎 SISTEMA VIP**\n' +
                        'Você não possui um cargo VIP válido.\n\n';

                }

                if (
                    member.permissions.has(
                        PermissionsBitField.Flags.ModerateMembers
                    )
                ) {

                    texto +=
                        '**🛡️ MODERAÇÃO**\n' +
                        '`/mute` — Silencia um usuário.\n';

                }

                if (
                    member.permissions.has(
                        PermissionsBitField.Flags.BanMembers
                    )
                ) {

                    texto +=
                        '`/ban` — Bane um usuário.\n';

                }

                if (
                    member.permissions.has(
                        PermissionsBitField.Flags.KickMembers
                    )
                ) {

                    texto +=
                        '`/kick` — Expulsa um usuário.\n';

                }

                if (
                    member.permissions.has(
                        PermissionsBitField.Flags.ManageRoles
                    )
                ) {

                    texto +=
                        '`/cargo` — Adiciona um cargo.\n' +
                        '`/tirarcargo` — Remove um cargo.\n';

                }

                if (
                    member.permissions.has(
                        PermissionsBitField.Flags.ManageMessages
                    )
                ) {

                    texto +=
                        '`/limpar` — Apaga mensagens.\n';

                }

                texto +=
                    '\n**🛡️ SISTEMA**\n' +
                    '`/protecao` — Mostra o status do anti-raid no canal de moderação.\n' +
                    '`/ajuda` — Mostra a ajuda geral.';

                const embed =
                    new EmbedBuilder()
                        .setTitle(
                            `📚 Comandos de ${interaction.user.username}`
                        )
                        .setDescription(
                            texto
                        )
                        .setTimestamp();

                return interaction.reply({
                    embeds: [embed],
                    ephemeral: true
                });

            }

            // ==================================================
            // CASAR
            // ==================================================

            if (
                comando === 'casar'
            ) {

                const alvo =
                    interaction.options.getUser(
                        'usuario'
                    );

                if (
                    alvo.id ===
                    interaction.user.id
                ) {

                    return interaction.reply({
                        content:
                            '❌ Você não pode se casar consigo mesmo.',
                        ephemeral: true
                    });

                }

                if (alvo.bot) {

                    return interaction.reply({
                        content:
                            '❌ Você não pode se casar com um bot.',
                        ephemeral: true
                    });

                }

                const autor =
                    obterUsuario(
                        interaction.guild.id,
                        interaction.user.id
                    );

                const parceiro =
                    obterUsuario(
                        interaction.guild.id,
                        alvo.id
                    );

                if (autor.parceiro) {

                    return interaction.reply({
                        content:
                            '❌ Você já está em um relacionamento.',
                        ephemeral: true
                    });

                }

                if (parceiro.parceiro) {

                    return interaction.reply({
                        content:
                            '❌ Essa pessoa já está em um relacionamento.',
                        ephemeral: true
                    });

                }

                casar(
                    interaction.guild.id,
                    interaction.user.id,
                    alvo.id
                );

                adicionarXP(
                    interaction.guild.id,
                    interaction.user.id,
                    50
                );

                adicionarXP(
                    interaction.guild.id,
                    alvo.id,
                    50
                );

                await enviarLog(
                    interaction.guild,
                    '💍 Casamento',
                    `${interaction.user} se casou com ${alvo}.`
                );

                return interaction.reply(
                    `💍 ${interaction.user} e ${alvo} agora estão casados! ❤️\n\n` +
                    `⭐ **+50 XP para cada um!**`
                );

            }

            // ==================================================
            // DIVÓRCIO
            // ==================================================

            if (
                comando === 'divorcio'
            ) {

                const usuario =
                    obterUsuario(
                        interaction.guild.id,
                        interaction.user.id
                    );

                if (!usuario.parceiro) {

                    return interaction.reply({
                        content:
                            '❌ Você não está em um relacionamento.',
                        ephemeral: true
                    });

                }

                const parceiroId =
                    divorciar(
                        interaction.guild.id,
                        interaction.user.id
                    );

                await enviarLog(
                    interaction.guild,
                    '💔 Divórcio',
                    `${interaction.user} terminou o relacionamento com <@${parceiroId}>.`
                );

                return interaction.reply(
                    `💔 ${interaction.user} e <@${parceiroId}> não estão mais juntos.`
                );

            }

            // ==================================================
            // INTERAÇÕES SOCIAIS
            // ==================================================

            const interacoes = {

                beijo: {
                    emoji: '💋',
                    texto: 'deu um beijo em',
                    xp: 15
                },

                abraco: {
                    emoji: '🤗',
                    texto: 'deu um abraço em',
                    xp: 10
                },

                carinho: {
                    emoji: '🖤',
                    texto: 'demonstrou carinho por',
                    xp: 10
                },

                presente: {
                    emoji: '🎁',
                    texto: 'deu um presente para',
                    xp: 20
                },

                amizade: {
                    emoji: '🤝',
                    texto: 'fez amizade com',
                    xp: 10
                },

                tapa: {
                    emoji: '👋',
                    texto: 'deu um tapa de brincadeira em',
                    xp: 5
                },

                gf: {
                    emoji: '💞',
                    texto: 'fez um GF com',
                    xp: 25,
                    chanceFalha: 0.30
                },

                xcam: {
                    emoji: '💞',
                    texto: 'fez um XCAM com',
                    xp: 25,
                    chanceFalha: 0.30
                }

            };

            if (
                interacoes[comando]
            ) {

                const alvo =
                    interaction.options.getUser(
                        'usuario'
                    );

                if (
                    alvo.id ===
                    interaction.user.id
                ) {

                    return interaction.reply({
                        content:
                            '❌ Você não pode usar isso em si mesmo.',
                        ephemeral: true
                    });

                }

                if (alvo.bot) {

                    return interaction.reply({
                        content:
                            '❌ Esse comando não funciona com bots.',
                        ephemeral: true
                    });

                }

                const info =
                    interacoes[comando];

                if (
                    comando === 'gf' ||
                    comando === 'xcam'
                ) {

                    const usuario =
                        obterUsuario(
                            interaction.guild.id,
                            interaction.user.id
                        );

                    if (
                        usuario.parceiro !==
                        alvo.id
                    ) {

                        return interaction.reply({
                            content:
                                `❌ Você só pode usar \`/${comando}\` com a pessoa com quem está casado(a) pelo bot! ❤️`,
                            ephemeral: true
                        });

                    }

                    const agora =
                        Date.now();

                    const ultimoUso =
                        usuario.cooldowns[comando] || 0;

                    const cooldown =
                        60 * 60 * 1000;

                    const restante =
                        cooldown -
                        (
                            agora -
                            ultimoUso
                        );

                    if (restante > 0) {

                        const minutos =
                            Math.ceil(
                                restante / 60000
                            );

                        return interaction.reply({
                            content:
                                `⏳ Você precisa esperar **${minutos} minuto(s)** para usar \`/${comando}\` novamente.`,
                            ephemeral: true
                        });

                    }

                    usuario.cooldowns[comando] =
                        agora;

                    salvarDados();

                    const falhou =
                        Math.random() <
                        info.chanceFalha;

                    if (falhou) {

                        return interaction.reply(
                            `❌ ${interaction.user} tentou fazer um ${comando.toUpperCase()} com ${alvo}, mas não deu certo! 😂\n\n` +
                            `⏳ Mesmo assim, seu cooldown foi ativado. Você poderá tentar novamente daqui a **1 hora**.`
                        );

                    }

                    adicionarXP(
                        interaction.guild.id,
                        interaction.user.id,
                        25
                    );

                    adicionarXPRelacionamento(
                        interaction.guild.id,
                        interaction.user.id,
                        alvo.id,
                        25
                    );

                    return interaction.reply(
                        `💞 ${interaction.user} fez um ${comando.toUpperCase()} com ${alvo}!\n\n` +
                        `⭐ **+25 XP**\n` +
                        `❤️ **+25 XP de relacionamento!**\n` +
                        `⏳ Você poderá usar novamente daqui a **1 hora**.`
                    );

                }

                adicionarXP(
                    interaction.guild.id,
                    interaction.user.id,
                    info.xp
                );

                adicionarXPRelacionamento(
                    interaction.guild.id,
                    interaction.user.id,
                    alvo.id,
                    info.xp
                );

                const autor =
                    obterUsuario(
                        interaction.guild.id,
                        interaction.user.id
                    );

                const parceiro =
                    autor.parceiro ===
                    alvo.id;

                let mensagem =
                    `${info.emoji} ${interaction.user} ${info.texto} ${alvo}!\n\n` +
                    `⭐ **+${info.xp} XP**`;

                if (parceiro) {

                    mensagem +=
                        `\n❤️ **+${info.xp} XP de relacionamento!**`;

                }

                return interaction.reply(
                    mensagem
                );

            }

            // ==================================================
            // PERFIL
            // ==================================================

            if (
                comando === 'perfil'
            ) {

                const alvo =
                    interaction.options.getUser(
                        'usuario'
                    ) ||
                    interaction.user;

                const usuario =
                    obterUsuario(
                        interaction.guild.id,
                        alvo.id
                    );

                const embed =
                    new EmbedBuilder()
                        .setTitle(
                            `👤 Perfil de ${alvo.username}`
                        )
                        .setDescription(
                            `⭐ **Nível:** ${usuario.nivel}\n` +
                            `✨ **XP:** ${usuario.xp}\n` +
                            `💬 **Mensagens:** ${usuario.mensagens}\n` +
                            `🎮 **Comandos:** ${usuario.comandos}\n` +
                            `❤️ **XP de relacionamento:** ${usuario.xpRelacionamento}`
                        )
                        .setThumbnail(
                            alvo.displayAvatarURL({
                                dynamic: true
                            })
                        )
                        .setTimestamp();

                return interaction.reply({
                    embeds: [embed]
                });

            }

            // ==================================================
            // RELACIONAMENTO
            // ==================================================

            if (
                comando === 'relacionamento'
            ) {

                const usuario =
                    obterUsuario(
                        interaction.guild.id,
                        interaction.user.id
                    );

                if (!usuario.parceiro) {

                    return interaction.reply(
                        '💔 Você está solteiro(a).'
                    );

                }

                return interaction.reply(
                    `❤️ Seu parceiro(a) é <@${usuario.parceiro}>!`
                );

            }

            // ==================================================
            // XP
            // ==================================================

            if (
                comando === 'xp'
            ) {

                const usuario =
                    obterUsuario(
                        interaction.guild.id,
                        interaction.user.id
                    );

                return interaction.reply(
                    `⭐ Você tem **${usuario.xp} XP** e está no **nível ${usuario.nivel}**.`
                );

            }

            // ==================================================
            // RANKING
            // ==================================================

            if (
                comando === 'ranking'
            ) {

                const usuarios =
                    dados[
                        interaction.guild.id
                    ] || {};

                const ranking =
                    Object.entries(
                        usuarios
                    )
                    .filter(
                        ([id, usuario]) =>
                            usuario &&
                            typeof usuario.nivel === 'number' &&
                            typeof usuario.xp === 'number'
                    )
                    .sort(
                        (a, b) =>
                            (
                                b[1].nivel * 100 +
                                b[1].xp
                            ) -
                            (
                                a[1].nivel * 100 +
                                a[1].xp
                            )
                    )
                    .slice(
                        0,
                        10
                    );

                if (
                    ranking.length === 0
                ) {

                    return interaction.reply(
                        '📊 Ainda não há ninguém no ranking.'
                    );

                }

                let texto =
                    '🏆 **Ranking de XP**\n\n';

                ranking.forEach(
                    ([id, usuario], index) => {

                        texto +=
                            `**${index + 1}.** <@${id}> — ` +
                            `Nível ${usuario.nivel} ` +
                            `(${usuario.xp} XP)\n`;

                    }
                );

                return interaction.reply(
                    texto
                );

            }

            // ==================================================
            // AJUDA
            // ==================================================

            if (
                comando === 'ajuda'
            ) {

                return interaction.reply(
                    '📚 **Comandos disponíveis:**\n\n' +

                    '`/info` — Mostra os comandos que você pode usar.\n' +
                    '`/perfil` — Mostra seu perfil.\n' +
                    '`/xp` — Mostra seu XP.\n' +
                    '`/viptime` — Mostra há quantos dias seu VIP está ativo e quando expira.\n' +
                    '`/ranking` — Mostra o ranking.\n' +
                    '`/casar` — Casa com alguém.\n' +
                    '`/divorcio` — Termina seu relacionamento.\n' +
                    '`/beijo` — Dá um beijo.\n' +
                    '`/abraco` — Dá um abraço.\n' +
                    '`/carinho` — Demonstra carinho.\n' +
                    '`/presente` — Dá um presente.\n' +
                    '`/amizade` — Faz amizade.\n' +
                    '`/tapa` — Dá um tapa de brincadeira.\n' +
                    '`/gf` — Tenta fazer um GF.\n' +
                    '`/xcam` — Tenta fazer um XCAM.\n\n' +

                    '**💎 Sistema VIP:**\n' +
                    'Os comandos VIP devem ser usados no canal VIP.\n' +
                    '`/vip criar` — Cria sua call VIP.\n' +
                    '`/vip-painel` — Envia/atualiza o painel de compras VIP (equipe).\n' +
                    '`/vip add` — Libera uma pessoa na sua call.\n' +
                    '`/vip remover` — Remove uma pessoa da sua call.\n' +
                    '`/vip fechar` — Fecha sua call VIP.\n' +
                    '`/vip nomecal` — Muda o nome da call.\n' +
                    '`/vip limite` — Muda o limite de pessoas.\n' +
                    '`/vip bitrate` — Muda o bitrate.\n' +
                    '`/vip info` — Mostra informações da call.\n\n' +

                    '**👑 Cargo VIP personalizado:**\n' +
                    'Disponível para Diamond, Magnata, Black e Legendary.\n' +
                    '`/vip criarcargo` — Cria seu cargo.\n' +
                    '`/vip editarcargo` — Edita nome, cor, emoji e menção.\n' +
                    '`/vip cargoadd` — Dá seu cargo para alguém.\n' +
                    '`/vip cargoremover` — Retira seu cargo de alguém.\n' +
                    '`/vip cargoinfo` — Mostra informações do cargo.\n' +
                    '`/vip excluircargo` — Exclui seu cargo.\n\n' +

                    '**🔒 Castigo:**\n' +
                    '`/castigo-status` — Mostra quanto tempo falta do seu castigo.\n' +
                    '`/cl [quantidade]` — Apaga suas mensagens anteriores somente neste canal; funciona em qualquer canal de texto.\n' +
                    '`/addxp` — Adiciona XP a um usuário (equipe).\n' +
                    '`/removexp` — Remove XP de um usuário (equipe).\n\n' +
                    '**💰 ECONOMIA**\n' +
                    '`/saldo` `/daily` `/work` `/transferir` `/loja` `/comprar` `/inventario` `/ricos` `/metas`\n\n' +
                    '**🎮 DIVERSÃO**\n' +
                    '`/8ball` `/caraoucoroa` `/dados` `/adivinha` `/rankingdiversao`\n\n' +
                    '**🛡️ Moderação:**\n' +
                    '`/castigo` — Aplica castigo.\n' +
                    '`/tirarcastigo` — Remove castigo.\n' +
                    'Os comandos de moderação devem ser usados no canal de moderação.'
                );

            }

            // ==================================================
            // STATUS DO CASTIGO
            // ==================================================

            if (
                comando === 'castigo-status'
            ) {

                const castigo = obterCastigo(
                    interaction.guild.id,
                    interaction.user.id
                );

                if (!castigo) {

                    limparDadosCastigo(
                        interaction.guild.id,
                        interaction.user.id
                    );

                    return interaction.reply({
                        content:
                            '✅ Você não está de castigo no momento.',
                        ephemeral: true
                    });

                }

                const restante =
                    castigo.fim - Date.now();

                return interaction.reply({
                    content:
                        `🔒 **Você está de castigo.**\n\n` +
                        `⏳ **Tempo restante:** ${formatarTempoRestante(restante)}\n` +
                        `🕐 **Termina em:** <t:${Math.floor(castigo.fim / 1000)}:F>\n` +
                        `📝 **Motivo:** ${castigo.motivo}`,
                    ephemeral: true
                });

            }

            // ==================================================
            // CASTIGO
            // ==================================================

            if (
                comando === 'castigo'
            ) {

                if (
                    !interaction.member.permissions.has(
                        PermissionsBitField.Flags.ModerateMembers
                    )
                ) {

                    return interaction.reply({
                        content:
                            '❌ Você não tem permissão para aplicar castigos.',
                        ephemeral: true
                    });

                }

                const alvo =
                    interaction.options.getMember(
                        'usuario'
                    );

                const minutos =
                    interaction.options.getInteger(
                        'minutos'
                    );

                const motivo =
                    interaction.options.getString(
                        'motivo'
                    ) ||
                    'Nenhum motivo informado.';

                if (!alvo) {

                    return interaction.reply({
                        content:
                            '❌ Usuário não encontrado.',
                        ephemeral: true
                    });

                }

                if (alvo.id === interaction.user.id) {

                    return interaction.reply({
                        content:
                            '❌ Você não pode colocar a si mesmo de castigo.',
                        ephemeral: true
                    });

                }

                if (alvo.user.bot) {

                    return interaction.reply({
                        content:
                            '❌ Você não pode colocar um bot de castigo.',
                        ephemeral: true
                    });

                }

                if (
                    alvo.id === interaction.guild.ownerId
                ) {

                    return interaction.reply({
                        content:
                            '❌ Não é possível colocar o dono do servidor de castigo.',
                        ephemeral: true
                    });

                }

                if (
                    interaction.member.roles.highest.position <=
                    alvo.roles.highest.position &&
                    interaction.user.id !== interaction.guild.ownerId
                ) {

                    return interaction.reply({
                        content:
                            '❌ Você não pode aplicar castigo em alguém com cargo igual ou superior ao seu.',
                        ephemeral: true
                    });

                }

                try {

                    await aplicarCastigo(
                        interaction.guild,
                        alvo,
                        minutos,
                        motivo
                    );

                } catch (erro) {

                    console.log(
                        '❌ Erro ao aplicar castigo:',
                        erro
                    );

                    return interaction.reply({
                        content:
                            `❌ Não consegui aplicar o castigo.\n\n${erro.message}`,
                        ephemeral: true
                    });

                }

                return interaction.reply(
                    `🔒 ${alvo} recebeu **castigo por ${minutos} minuto(s)**.\n` +
                    `📝 Motivo: **${motivo}**\n` +
                    `⏳ Termina em: <t:${Math.floor((Date.now() + minutos * 60 * 1000) / 1000)}:R>`
                );

            }

            // ==================================================
            // TIRAR CASTIGO
            // ==================================================

            if (
                comando === 'tirarcastigo'
            ) {

                if (
                    !interaction.member.permissions.has(
                        PermissionsBitField.Flags.ModerateMembers
                    )
                ) {

                    return interaction.reply({
                        content:
                            '❌ Você não tem permissão para remover castigos.',
                        ephemeral: true
                    });

                }

                const alvo =
                    interaction.options.getMember(
                        'usuario'
                    );

                if (!alvo) {

                    return interaction.reply({
                        content:
                            '❌ Usuário não encontrado.',
                        ephemeral: true
                    });

                }

                const removido = await removerCastigo(
                    interaction.guild,
                    alvo,
                    `Castigo removido por ${interaction.user.tag}`
                );

                if (!removido) {

                    return interaction.reply({
                        content:
                            `ℹ️ ${alvo} não está de castigo.`,
                        ephemeral: true
                    });

                }

                return interaction.reply(
                    `🔓 O castigo de ${alvo} foi removido com sucesso.`
                );

            }

            // ==================================================
            // MUTE
            // ==================================================

            if (
                comando === 'mute'
            ) {

                if (
                    !interaction.member.permissions.has(
                        PermissionsBitField.Flags.ModerateMembers
                    )
                ) {

                    return interaction.reply({
                        content:
                            '❌ Você não tem permissão para isso.',
                        ephemeral: true
                    });

                }

                const alvo =
                    interaction.options.getMember(
                        'usuario'
                    );

                const minutos =
                    interaction.options.getInteger(
                        'minutos'
                    );

                if (!alvo) {

                    return interaction.reply({
                        content:
                            '❌ Usuário não encontrado.',
                        ephemeral: true
                    });

                }

                await alvo.timeout(
                    minutos * 60 * 1000
                );

                return interaction.reply(
                    `🔇 ${alvo} foi silenciado por ${minutos} minuto(s).`
                );

            }

            // ==================================================
            // BAN
            // ==================================================

            if (
                comando === 'ban'
            ) {

                if (
                    !interaction.member.permissions.has(
                        PermissionsBitField.Flags.BanMembers
                    )
                ) {

                    return interaction.reply({
                        content:
                            '❌ Você não tem permissão para isso.',
                        ephemeral: true
                    });

                }

                const alvo =
                    interaction.options.getMember(
                        'usuario'
                    );

                const motivo =
                    interaction.options.getString(
                        'motivo'
                    ) ||
                    'Nenhum motivo informado.';

                if (!alvo) {

                    return interaction.reply({
                        content:
                            '❌ Usuário não encontrado.',
                        ephemeral: true
                    });

                }

                await alvo.ban({
                    reason: motivo
                });

                await enviarLog(
                    interaction.guild,
                    '🔨 Banimento',
                    `${interaction.user} baniu ${alvo}.\nMotivo: ${motivo}`
                );

                return interaction.reply(
                    `🔨 ${alvo} foi banido.\nMotivo: ${motivo}`
                );

            }

            // ==================================================
            // KICK
            // ==================================================

            if (
                comando === 'kick'
            ) {

                if (
                    !interaction.member.permissions.has(
                        PermissionsBitField.Flags.KickMembers
                    )
                ) {

                    return interaction.reply({
                        content:
                            '❌ Você não tem permissão para isso.',
                        ephemeral: true
                    });

                }

                const alvo =
                    interaction.options.getMember(
                        'usuario'
                    );

                const motivo =
                    interaction.options.getString(
                        'motivo'
                    ) ||
                    'Nenhum motivo informado.';

                if (!alvo) {

                    return interaction.reply({
                        content:
                            '❌ Usuário não encontrado.',
                        ephemeral: true
                    });

                }

                await alvo.kick(
                    motivo
                );

                await enviarLog(
                    interaction.guild,
                    '👢 Expulsão',
                    `${interaction.user} expulsou ${alvo}.\nMotivo: ${motivo}`
                );

                return interaction.reply(
                    `👢 ${alvo} foi expulso.\nMotivo: ${motivo}`
                );

            }

            // ==================================================
            // CARGO
            // ==================================================

            if (
                comando === 'cargo'
            ) {

                if (
                    !interaction.member.permissions.has(
                        PermissionsBitField.Flags.ManageRoles
                    )
                ) {

                    return interaction.reply({
                        content:
                            '❌ Você não tem permissão para isso.',
                        ephemeral: true
                    });

                }

                const alvo =
                    interaction.options.getMember(
                        'usuario'
                    );

                const cargo =
                    interaction.options.getRole(
                        'cargo'
                    );

                if (
                    !alvo ||
                    !cargo
                ) {

                    return interaction.reply({
                        content:
                            '❌ Usuário ou cargo não encontrado.',
                        ephemeral: true
                    });

                }

                if (
                    cargo.position >=
                    interaction.guild.members.me.roles.highest.position
                ) {

                    return interaction.reply({
                        content:
                            '❌ Não posso adicionar esse cargo porque ele está acima ou no mesmo nível do meu maior cargo.',
                        ephemeral: true
                    });

                }

                await alvo.roles.add(
                    cargo
                );

                return interaction.reply(
                    `✅ O cargo ${cargo} foi adicionado a ${alvo}.`
                );

            }

            // ==================================================
            // TIRAR CARGO
            // ==================================================

            if (
                comando === 'tirarcargo'
            ) {

                if (
                    !interaction.member.permissions.has(
                        PermissionsBitField.Flags.ManageRoles
                    )
                ) {

                    return interaction.reply({
                        content:
                            '❌ Você não tem permissão para isso.',
                        ephemeral: true
                    });

                }

                const alvo =
                    interaction.options.getMember(
                        'usuario'
                    );

                const cargo =
                    interaction.options.getRole(
                        'cargo'
                    );

                if (
                    !alvo ||
                    !cargo
                ) {

                    return interaction.reply({
                        content:
                            '❌ Usuário ou cargo não encontrado.',
                        ephemeral: true
                    });

                }

                if (
                    cargo.position >=
                    interaction.guild.members.me.roles.highest.position
                ) {

                    return interaction.reply({
                        content:
                            '❌ Não posso remover esse cargo porque ele está acima ou no mesmo nível do meu maior cargo.',
                        ephemeral: true
                    });

                }

                await alvo.roles.remove(
                    cargo
                );

                return interaction.reply(
                    `✅ O cargo ${cargo} foi removido de ${alvo}.`
                );

            }

            // ==================================================
            // LIMPAR
            // ==================================================

            if (
                comando === 'limpar'
            ) {

                if (
                    !interaction.member.permissions.has(
                        PermissionsBitField.Flags.ManageMessages
                    )
                ) {

                    return interaction.reply({
                        content:
                            '❌ Você não tem permissão para isso.',
                        ephemeral: true
                    });

                }

                const quantidade =
                    interaction.options.getInteger(
                        'quantidade'
                    );

                await interaction.channel.bulkDelete(
                    quantidade,
                    true
                );

                return interaction.reply({
                    content:
                        `🧹 ${quantidade} mensagens foram apagadas.`,
                    ephemeral: true
                });

            }

            // ==================================================
            // PROTEÇÃO
            // ==================================================

            if (
                comando === 'protecao'
            ) {

                const ativo =
                    servidorEmRaid(
                        interaction.guild.id
                    );

                return interaction.reply(
                    ativo
                        ? '🚨 **MODO ANTI-RAID ATIVO!** O servidor está temporariamente protegido.'
                        : '🛡️ **Sistema de proteção ativo.** O modo anti-raid está em espera.'
                );

            }

        } catch (erro) {

            console.log(
                '❌ Erro na interação:',
                erro
            );

            if (
                interaction.replied ||
                interaction.deferred
            ) {
                return;
            }

            await interaction.reply({
                content:
                    '❌ Ocorreu um erro ao executar esse comando.',
                ephemeral: true
            });

        }

    }
);

// ======================================================
// BLOQUEIO DE VOZ DURANTE CASTIGO
// ======================================================

client.on(
    'voiceStateUpdate',
    async (oldState, newState) => {

        try {

            if (!newState.guild || !newState.member) {
                return;
            }

            const castigo = obterCastigo(
                newState.guild.id,
                newState.member.id
            );

            if (!castigo) {
                return;
            }

            if (newState.channelId) {

                await newState.member.voice.disconnect(
                    'Usuário está de castigo.'
                ).catch(() => null);

            }

        } catch (erro) {

            console.log(
                '❌ Erro no bloqueio de voz do castigo:',
                erro
            );

        }

    }
);

// ======================================================
// MENSAGENS
// ======================================================

client.on(
    'messageCreate',
    async message => {

        try {

            if (
                message.author.bot ||
                !message.guild
            ) {
                return;
            }

            const guildId =
                message.guild.id;

            // ==================================================
            // BLOQUEIO DE MENSAGEM DURANTE CASTIGO
            // ==================================================

            const castigoAtivo = obterCastigo(
                guildId,
                message.author.id
            );

            if (castigoAtivo) {

                await message.delete().catch(() => null);

                return;

            }

            const usuario =
                obterUsuario(
                    guildId,
                    message.author.id
                );

            usuario.mensagens++;

            adicionarXP(
                guildId,
                message.author.id,
                5
            );

            salvarDados();

            // ==================================================
            // ANTI-SPAM
            // ==================================================

            const agora =
                Date.now();

            if (!dados[guildId].spam) {
                dados[guildId].spam = {};
            }

            if (
                !dados[guildId].spam[
                    message.author.id
                ]
            ) {

                dados[guildId].spam[
                    message.author.id
                ] = [];

            }

            const registros =
                dados[guildId].spam[
                    message.author.id
                ];

            registros.push(agora);

            while (
                registros.length &&
                agora -
                registros[0] >
                PROTECAO.intervaloSpam
            ) {

                registros.shift();

            }

            if (
                registros.length >=
                PROTECAO.mensagensSpam
            ) {

                registros.length = 0;

                try {

                    await message.member.timeout(
                        PROTECAO.timeoutSpam,
                        'Spam detectado'
                    );

                    await enviarLog(
                        message.guild,
                        '🛡️ Anti-Spam',
                        `${message.author} recebeu timeout por spam.`
                    );

                } catch (erro) {

                    console.log(
                        '❌ Erro no anti-spam:',
                        erro
                    );

                }

            }

            // ==================================================
            // MENÇÕES
            // ==================================================

            if (
                message.mentions.users.size >=
                PROTECAO.mencoesMaximas
            ) {

                try {

                    await message.delete();

                    await enviarLog(
                        message.guild,
                        '🛡️ Proteção contra menções',
                        `${message.author} enviou muitas menções em uma mensagem.`
                    );

                } catch (erro) {

                    console.log(
                        '❌ Erro ao proteger menções:',
                        erro
                    );

                }

            }

            // ==================================================
            // LINKS
            // ==================================================

            const links =
                message.content.match(
                    /https?:\/\/\S+/gi
                ) || [];

            if (
                links.length >
                PROTECAO.linksMaximos
            ) {

                try {

                    await message.delete();

                    await enviarLog(
                        message.guild,
                        '🛡️ Proteção contra links',
                        `${message.author} enviou muitos links.`
                    );

                } catch (erro) {

                    console.log(
                        '❌ Erro ao apagar mensagem:',
                        erro
                    );

                }

            }

            // ==================================================
            // CONVITES DISCORD
            // ==================================================

            const conviteDiscord =
                /(?:discord\.gg|discord\.com\/invite|discordapp\.com\/invite)\/[a-z0-9-]+/i;

            if (
                conviteDiscord.test(
                    message.content
                )
            ) {

                try {

                    await message.delete();

                    await enviarLog(
                        message.guild,
                        '🛡️ Convite bloqueado',
                        `${message.author} enviou um convite de outro servidor.`
                    );

                } catch (erro) {

                    console.log(
                        '❌ Erro ao bloquear convite:',
                        erro
                    );

                }

            }

            // ==================================================
            // LINK DURANTE ANTI-RAID
            // ==================================================

            if (
                servidorEmRaid(guildId) &&
                links.length > 0
            ) {

                try {

                    await message.delete();

                    await enviarLog(
                        message.guild,
                        '🚨 Link bloqueado durante anti-raid',
                        `${message.author} tentou enviar um link durante o modo de proteção.`
                    );

                } catch (erro) {

                    console.log(
                        '❌ Erro ao bloquear link no anti-raid:',
                        erro
                    );

                }

            }

            // ==================================================
            // !OI
            // ==================================================

            if (
                message.content
                    .trim()
                    .toLowerCase() ===
                '!oi'
            ) {

                await message.reply(
                    'Oi! Eu estou funcionando! 🤖'
                );

            }

        } catch (erro) {

            console.log(
                '❌ Erro na mensagem:',
                erro
            );

        }

    }
);

// ======================================================
// LOGIN
// ======================================================

if (
    !TOKEN ||
    TOKEN === 'COLOQUE_SEU_NOVO_TOKEN_AQUI'
) {

    console.log(
        '❌ Você precisa colocar o token do bot na constante TOKEN.'
    );

} else {

    client.login(TOKEN)
        .then(() => {

            console.log(
                '🔐 Login realizado com sucesso.'
            );

        })
        .catch(erro => {

            console.log(
                '❌ Erro ao fazer login no Discord:',
                erro
            );

        });

}

const PORT = process.env.PORT || 3000;

http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Bot online!');
}).listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor web rodando na porta ${PORT}`);
});
