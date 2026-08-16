import {
    Client,
    GatewayIntentBits,
    PermissionsBitField,
    SlashCommandBuilder,
    REST,
    Routes,
    EmbedBuilder,
    ChannelType
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
        GatewayIntentBits.MessageContent
    ]
});

// ======================================================
// CONFIGURAÇÕES
// ======================================================

const CANAL_LOGS = '📋・logs';

const CARGO_SUPORTE = '1537432685075496980';

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
    'protecao'
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
    'ajuda'
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
        nome: 'Black',
        chave: 'black',
        id: CARGOS_VIP.black,
        categoria: CATEGORIA_ALTA_CUPULA
    },
    {
        nome: 'Magnata',
        chave: 'magnata',
        id: CARGOS_VIP.magnata,
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
// GARANTIR USUÁRIO
// ======================================================

function obterUsuario(guildId, userId) {

    if (!dados[guildId]) {
        dados[guildId] = {};
    }

    if (!dados[guildId][userId]) {

        dados[guildId][userId] = {

            xp: 0,
            nivel: 1,
            parceiro: null,
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

    return dados[guildId][userId];

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
                UseVAD: true
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
                UseVAD: true
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

    const permissionOverwrites = [

        {
            id: guild.roles.everyone.id,

            deny: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.Connect
            ]
        },

        {
            id: member.id,

            allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.Connect,
                PermissionsBitField.Flags.Speak,
                PermissionsBitField.Flags.Stream,
                PermissionsBitField.Flags.UseVAD
            ]
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
                PermissionsBitField.Flags.UseVAD
            ]

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

    const usuario =
        obterUsuario(
            guildId,
            userId
        );

    usuario.xp += quantidade;

    while (
        usuario.xp >=
        usuario.nivel * 100
    ) {

        usuario.xp -=
            usuario.nivel * 100;

        usuario.nivel++;

    }

    salvarDados();

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

].map(c => c.toJSON());

// ======================================================
// BOT ONLINE
// ======================================================

client.once(
    'clientReady',
    async () => {

        carregarDados();

        console.log(
            `🤖 ${client.user.tag} está online!`
        );

        console.log(
            `💎 Canal VIP: ${CANAL_COMANDOS_VIP}`
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

        } catch (erro) {

            console.log(
                '❌ Erro ao registrar comandos:',
                erro
            );

        }

    }
);

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

            if (
                !interaction.isChatInputCommand()
            ) {
                return;
            }

            if (!interaction.guild) {
                return;
            }

            const comando =
                interaction.commandName;

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

                    '**🛡️ Moderação:**\n' +
                    'Os comandos de moderação devem ser usados no canal de moderação.'
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
