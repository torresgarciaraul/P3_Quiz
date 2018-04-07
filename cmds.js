const {models} = require('./model');
const {colorize, log, biglog, errorlog} = require('./out');
const  Sequelize = require('sequelize');


exports.helpCmd = (rl) => {
    log("Comandos:");
    log(" h|help - Muestra esta ayuda.");
    log(" list - Listar los quizzes existentes.");
    log(" show <id> - Muestra la pregunta y la respuesta el quiz indicado.");
    log(" add - Añadir un nuevo quiz interactivamente.");
    log(" delete <id> - Borrar el quiz indicado.");
    log(" edit <id> - Editar el quiz indicado.");
    log(" test <id> - Probar el quiz indicado.");
    log(" p|play - Jugar a preguntar aleatoriamente todos los quizzes.");
    log("credits - Créditos.");
    log("q|quit - Salir del programa.");
    rl.prompt();
};

exports.quitCmd = (rl) => {
    rl.close();
    rl.prompt();
};

const makeQuestion = (rl, msg) => {
    return new Sequelize.Promise((resolve, reject) => {
        rl.question(colorize(msg, 'red'), answer => {
            resolve(answer.trim());
        });
    });
};


exports.addCmd = (rl) => {
    makeQuestion(rl, 'Introduce una pregunta: ')
        .then(question => {
            return makeQuestion(rl, 'Introduce una respuesta: ')
                .then(answer => {
                    return {question: question, answer: answer};
                });
        })
        .then(quiz => {
            return models.quiz.create(quiz);
        })
        .then((quiz) => {
            log(`${colorize('Se ha añadido ', 'magenta')} ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
        })
        .catch(Sequelize.ValidationError, error => {
            errorlog('El quiz es erroneo: ');
            error.errors.forEach(({message}) => errorlog(message));
        })
        .catch(error => {
            errorlog(error.message);
        })
        .then(() => {
            rl.prompt();
        });
};

exports.listCmd = (rl) => {
    models.quiz.findAll()
        .each((quiz) => {
            log(` [${colorize(quiz.id, 'magenta')}]: ${quiz.question}`);
        })
        .catch(error => {
            errorlog(error.message);
        })
        .then(() => {
            rl.prompt();
        });
};

const validateId = (id) => {
    return new Sequelize.Promise((resolve, reject) => {
        if (typeof id === "undefined") {
            reject(new Error(`Falta el parámetro <id>.`));
        } else {
            id = parseInt(id);
            if (Number.isNaN(id)) {
                reject(new Error(`El valor del parámetro <id> no es un entero.`));
            } else {
                resolve(id);
            }
        }
    });
};

exports.showCmd = (id, rl) => {
    validateId(id)
        .then(id => models.quiz.findById(id))
        .then(quiz => {
            if (!quiz) {
                throw new Error(`No existe un quiz asociado al id=${id}`);
            }
            log(`[${colorize(quiz.id, 'magenta')}]: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
        })
        .catch(error => {
            errorlog(error.message);
        })
        .then(() => {
            rl.prompt();
        });
};

exports.testCmd = (id, rl) => {
    validateId(id)
        .then(id => models.quiz.findById(id))
        .then(quiz => {
            if (!quiz) {   //Dado un id que no exise, no existirá el quiz
                throw new Error(`No existe un quiz asociado al id=${id}.`);
            }
            return makeQuestion(rl, `${quiz.question}? `)
                .then(ans => {
                    if (answer.toLowerCase().trim() === quiz.answer.toLowerCase().trim()) {
                        biglog('CORRECTO', 'green');
                        rl.prompt();
                    } else {
                        biglog('INCORRECTO', 'red');
                        rl.prompt();
                    }
                });
        })
        .catch(error => {
            errorlog(error.message)
        })
        .then(() => {
            rl.prompt();
        });
};

exports.playCmd = (rl) => {
    let score = 0;   // Variable para almacenar los aciertos

    let toBeResolved = [];
    models.quiz.findAll({raw: true})     //Hacemos una copia de la tabla quiz
        .then(quizzes => {
            toBeResolved=quizzes;       //Array con los quizzes que faltan por resolver.

            const playOne = () => {     //Función para ir preguntando todos los quizzes
                if (toBeResolved.length <= 0) {    //Si no quedan preguntas(se han preguntado todas)--- Fin del juego
                    log("No hay nada más que preguntar.");
                    log(`Fin del juego. Aciertos: ${score}`);
                    biglog(`${score}`, 'magenta');
                    rl.prompt();
                }
                else
                {
                    let id = Math.trunc(Math.random() * toBeResolved.length); //Obtenemos un indice al azar
                    let quiz = toBeResolved[id];
                    toBeResolved.splice(id, 1);
                    return makeQuestion(rl, quiz.question + '? ')
                        .then(a => {
                            if (a.trim().toLowerCase() === quiz.answer.trim().toLowerCase()) {
                                score++;
                                log(`CORRECTO - Lleva ${score} aciertos.`);
                                playOne();
                            } else {
                                log('INCORRECTO');
                                log(`Fin del juego. Aciertos: ${score}`);
                                biglog(`${score}`, 'magenta');
                            }
                        })
                        .catch(error => {
                            errorlog(error.message);
                        })
                        .then(() => {
                            rl.prompt();
                        });
                }
            };
            playOne();
        })
        .catch(error => {
            errorlog(error.message);
        })
        .then(() => {
            rl.prompt();
        });
};

exports.deleteCmd = (id, rl) => {
    validateId(id)
        .then(id => {
            models.quiz.destroy({where: {id}});
        })
        .catch(error => {
            errorlog(error.message)
        })
        .then(() => {
            rl.prompt();
        });
};

exports.editCmd = (id, rl) => {
    validateId(id)
        .then(id => models.quiz.findById(id))
        .then(quiz => {
            if (!quiz) {
                throw new Error(`No existe un quiz asociado al id=${id}.`);
            }
            process.stdout.isTTY && setTimeout(() => {
                rl.write(quiz.question)
            }, 0);
            return makeQuestion(rl, 'Introduzca una pregunta: ')
                .then(question => {
                    process.stdout.isTTY && setTimeout(() => {
                        rl.write(quiz.answer)
                    }, 0);
                    return makeQuestion(rl, 'Introduzca una respuesta: ')
                        .then(answer => {
                            quiz.question = question;
                            quiz.answer = answer;
                            return quiz;
                        });
                });
        })
        .then(quiz => {
            return quiz.save();
        })
        .then(quiz => {
            log(` Se ha cambiado el quiz ${colorize(quiz.id, 'magenta')} por: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
        })
        .catch(Sequelize.ValidationError, error => {
            errorlog('El quiz es erroneo: ');
            error.errors.forEach(({message}) => errorlog(message));
        })
        .catch(error => {
            errorlog(error.message);
        })
        .then(() => {
            rl.prompt();
        });
};


exports.creditsCmd = (rl) => {
    log('RAUL');
    rl.prompt();
};