/* eslint-disable  func-names */
/* eslint-disable  no-console */

const Alexa = require('ask-sdk-core');
const getDirectionsSpeech = 'To play this game, you and I will think of secret numbers. '
    + 'Then we will take turns guessing the sum of our secret numbers. '
    + 'Whoever is closest wins. ';

const playGameIntroSpeech = 'To play guess the total, say play the game.';
const playRepromptSpeech = 'If you need directions, say directions.';

const playAgainSpeech = 'To play again, say play again.';

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },
  handle(handlerInput) {

    return handlerInput.responseBuilder
      .speak(playGameIntroSpeech)
      .reprompt(playRepromptSpeech)
      .withSimpleCard('Guess the Sum', playGameIntroSpeech)
      .getResponse();
  },
};

const pickRandomFromRange = (from = 0, to = 10) => {
  // remember to offset by from to start at the correct point in the range where from != 0
  return Math.floor(Math.random() * (to - from + 1)) + from;
};

const extractSlotValues = (intent) => {
  const playerSecretNumber = parseInt(intent.slots.playerSecretNumber.value, 10);
  const playerGuess = parseInt(intent.slots.playerGuess.value, 10);
  return {
    playerSecretNumber,
    playerGuess
  };
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
  speechText += 'Now I will calculate the sum. ';
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
  const validRangeSpeech = 'Pick a number from zero to ten. ';
  const notNumericSpeech = 'That is not a number. Try again. ';
  const outOfSecretRange = 'Your secret number has to be from zero to ten. Try again. ';
  const outOfGuessRange = 'Your guess should be a number from zero to twenty. Try again. ';
  const { intent } = handlerInput.requestEnvelope.request;
  const { playerSecretNumber, playerGuess } = intent.slots;
  let slotValue;
  let validationError = false;
  let validationProblemSpeech;

  console.log(intent.slots);

  if (playerSecretNumber.value) {
    validationError = false;
    slotValue = parseInt(playerSecretNumber.value, 10);
    if (Number.isNaN(slotValue)) {
      validationProblemSpeech = notNumericSpeech;
      validationError = true;
    } else if (slotValue < 0 || slotValue > 10) {
      validationProblemSpeech = outOfSecretRange;
      validationError = true;
    }
    if (validationError) {
      return handlerInput.responseBuilder
        .speak(validationProblemSpeech)
        .reprompt(validRangeSpeech)
        .addElicitSlotDirective(intent.slots.playerSecretNumber.name)
        .getResponse();
    }
  }

  if (playerGuess.value) {
    validationError = false;
    slotValue = parseInt(playerGuess.value, 10);
    if (Number.isNaN(slotValue)) {
      validationProblemSpeech = notNumericSpeech;
      validationError = true;
    } else if (slotValue < 0 || slotValue > 20) {
      validationProblemSpeech = outOfGuessRange;
      validationError = true;
    }
    if (validationError) {
      return handlerInput.responseBuilder
        .speak(validationProblemSpeech)
        .reprompt(validRangeSpeech)
        .addElicitSlotDirective(intent.slots.playerSecretNumber.name)
        .getResponse();
    }
  }

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
      .reprompt(playGameIntroSpeech)
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
