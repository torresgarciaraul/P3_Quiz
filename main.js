const readline = require('readline');
const {colorize, log, biglog, errorlog} = require('./out');
const cmds = require('./cmds');

biglog("CORE QUIZ", 'green');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: colorize(colorize('quiz > ', 'blue'), 'bgRedBright'),
    completer: (line) => {
        const completions = 'h help add delete edit list test p play q quit credits '.split(' ');
        const hits = completions.filter((c) => c.startsWith(line));
        return [hits.length ? hits : completions, line];
    }
});

rl.prompt();
rl
    .on('line', (line) => {
        let args = line.split(" ");
        let cmd = args[0].toLowerCase().trim();
        let id = args[1];

        switch (cmd) {
            case '':
                rl.prompt();
                break;

            case 'h':
            case 'help':
                cmds.helpCmd(rl);
                break;

            case 'quit':
            case 'q':
                cmds.quitCmd(rl);
                break;

            case 'add':
                cmds.addCmd(rl);
                break;

            case 'list':
                cmds.listCmd(rl);
                break;

            case 'show':
                cmds.showCmd(id, rl);
                break;

            case 'test':
                cmds.testCmd(id, rl);
                break;

            case 'play':
            case 'p':
                cmds.playCmd(rl);
                break;

            case 'delete':
                cmds.deleteCmd(id, rl);
                break;

            case 'edit':
                cmds.editCmd(id, rl);
                break;
            case 'credits':
                cmds.creditsCmd(rl);
                break;

            default:
                log(`Comando desconocido: '${colorize(line.trim(), 'red')}'`);
                log(`Use ${colorize('help', 'green')} para ver todos los comandos disponibles`);
                rl.prompt();
                break;
        }
    })
    .on('close', () => {
        log('Hasta luego!');
        process.exit(0);
    });

