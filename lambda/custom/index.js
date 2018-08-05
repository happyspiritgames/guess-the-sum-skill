/* eslint-disable  func-names */
/* eslint-disable  no-console */

const Alexa = require('ask-sdk-core');

const getDirectionsSpeech = 'To play this game, you and I will think of secret numbers. '
    + 'Then we will take turns guessing the sum of our secret numbers. '
    + 'Whoever is closest wins. ';

const playGameSpeech = 'When you are ready, say play the game.';

const playAgainSpeech = 'To play again, say play again.';

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },
  handle(handlerInput) {
    const speechText = 'Guess the sum. ' + playGameSpeech;

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(playGameSpeech)
      .withSimpleCard('Guess the Sum', speechText)
      .getResponse();
  },
};

const pickRandomFromRange = (from = 0, to = 10) => {
  // remember to offset by from to start at the correct point in the range where from != 0
  return Math.floor(Math.random() * (to - from + 1)) + from;
};

const extractSlotValues = (intent) => {
  const playerSecretNumber = parseInt(intent.slots.playerSecretNumber.value);
  const playerGuess = parseInt(intent.slots.playerGuess.value);
  return {
    playerSecretNumber,
    playerGuess
  }
};

const announceWinner = (handlerInput) => {
  let speechText;
  const { playerSecretNumber, playerGuess } = extractSlotValues(handlerInput.requestEnvelope.request.intent);

  if (Number.isNaN(playerSecretNumber) || Number.isNaN(playerGuess)) {
    speechText = 'One of the answers you gave me is not a number. You forfeit.';
    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(playAgainSpeech)
      .withSimpleCard('Guess the Sum', speechText)
      .getResponse();
  }

  // skill takes turn
  const skillSecretNumber = pickRandomFromRange();
  let skillGuess;
  do {
    skillGuess = pickRandomFromRange(skillSecretNumber, 20);
  } while (skillGuess === playerGuess);

  const sum = playerSecretNumber + skillSecretNumber;
  const playerDelta = Math.abs(playerGuess - sum);
  const skillDelta = Math.abs(skillGuess - sum);

  speechText = `My guess is ${skillGuess}. `;
  speechText += 'Now I will calculate the sum. '
  speechText += `My secret number is ${skillSecretNumber}, so the sum is ${sum}. `;

  if (playerDelta < skillDelta) {
    speechText += 'Your guess is closer to the sum, so you win. That is worth two points. ';
    if (playerDelta === 0) {
      speechText += 'Also, you guessed the sum exactly, so you get an extra point. Well done. ';
    }
  } else if (playerDelta > skillDelta) {
    speechText += 'My guess is closer to the sum, so I win. ';
    if (skillDelta === 0) {
      speechText += 'Also, I guessed the sum exactly. Aren\'t you impressed? ';
    }
  } else {
    speechText += 'We tied. Our guesses are the same distance from the sum. We each get a point. ';
  }

  return handlerInput.responseBuilder
    .speak(speechText)
    .reprompt(playAgainSpeech)
    .withSimpleCard('Guess the Sum', speechText)
    .getResponse();
};

const verifySlots = (handlerInput) => {
  const { intent } = handlerInput.requestEnvelope.request;
  const { playerSecretNumber, playerGuess } = extractSlotValues(intent);
  const validRangeSpeech = 'Pick a number from zero to ten. ';
  let outOfRangeSpeech;

  if (playerSecretNumber && !Number.isNaN(playerSecretNumber)) {
    if (playerSecretNumber < 0 || playerSecretNumber > 10) {
      outOfRangeSpeech = 'Your secret number has to be from zero to ten. Try again. ';
      return handlerInput.responseBuilder
        .speak(outOfRangeSpeech)
        .reprompt(validRangeSpeech)
        .addElicitSlotDirective(intent.slots.playerSecretNumber.name)
        .getResponse();
    }
  }

  if (playerGuess && !Number.isNaN(playerGuess)) {
    if (playerGuess < 0 || playerGuess > 20) {
      outOfRangeSpeech = 'Your guess should be a number from zero to twenty. Try again. ';
      return handlerInput.responseBuilder
        .speak(outOfRangeSpeech)
        .reprompt(validRangeSpeech)
        .addElicitSlotDirective(intent.slots.playerGuess.name)
        .getResponse();
    }
  }

  // if (playerSecretNumber) {
  //   if (Number.isNaN(playerSecretNumber)) {
  //     outOfRangeSpeech = 'That is not a number. Try again. ';
  //     return handlerInput.responseBuilder
  //       .speak(outOfRangeSpeech)
  //       .reprompt(validRangeSpeech)
  //       .addElicitSlotDirective(intent.slots.playerSecretNumber.name)
  //       .getResponse();
  //   } else if (playerSecretNumber < 0 || playerSecretNumber > 10) {
  //     outOfRangeSpeech = 'Your secret number has to be from zero to ten. Try again. ';
  //     return handlerInput.responseBuilder
  //       .speak(outOfRangeSpeech)
  //       .reprompt(validRangeSpeech)
  //       .addElicitSlotDirective(intent.slots.playerSecretNumber.name)
  //       .getResponse();
  //   }
  // }

  // if (playerGuess && !Number.isNaN(playerGuess)) {
  //   if (playerGuess < 0 || playerGuess > 20) {
  //     outOfRangeSpeech = 'Your guess should be from zero to twenty. Try again. ';
  //     return handlerInput.responseBuilder
  //       .speak(outOfRangeSpeech)
  //       .reprompt()
  //       .addElicitSlotDirective(intent.slots.playerGuess.name)
  //       .getResponse();
  //   }
  // }

  return handlerInput.responseBuilder
    .addDelegateDirective(intent)
    .getResponse();
};

const PlayGameIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'PlayGameIntent';
  },
  handle(handlerInput) {
    const { dialogState } = handlerInput.requestEnvelope.request;

    if (dialogState === 'COMPLETED') {
      return announceWinner(handlerInput);
    } else {
      return verifySlots(handlerInput);
    }
  },
};

const GetDirectionsIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'GetDirections';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(getDirectionsSpeech)
      .reprompt(playGameSpeech)
      .withSimpleCard('Guess the Sum', getDirectionsSpeech)
      .getResponse();
  },
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const speechText = 'You can say hello to me!';

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard('Guess the Sum', speechText)
      .getResponse();
  },
};

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
        || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    const speechText = 'Goodbye!';

    return handlerInput.responseBuilder
      .speak(speechText)
      .withSimpleCard('Guess the Sum', speechText)
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);

    return handlerInput.responseBuilder
      .speak('Sorry, I can\'t understand the command. Please say again.')
      .reprompt('Sorry, I can\'t understand the command. Please say again.')
      .getResponse();
  },
};

const skillBuilder = Alexa.SkillBuilders.custom();

exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
    PlayGameIntentHandler,
    GetDirectionsIntentHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
