/* eslint-disable  func-names */
/* eslint-disable  no-console */

const Alexa = require('ask-sdk-core');

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },
  handle(handlerInput) {
    const speechText = 'Guess the sum. When you are ready, say play the game.';

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard('Guess the Sum', speechText)
      .getResponse();
  },
};

const pickRandomFromRange = (from = 0, to = 10) => {
  // remember to offset by from to start at the correct point in the range where from != 0
  return Math.floor(Math.random() * (to - from + 1)) + from;
};

const announceWinner = (handlerInput) => {
  let speechText;
  const { slots } = handlerInput.requestEnvelope.request.intent;

  const playerSecretNumber = parseInt(slots.playerSecretNumber.value);
  const playerGuess = parseInt(slots.playerGuess.value);
  if (Number.isNaN(playerSecretNumber) || Number.isNaN(playerGuess)) {
    speechText = 'One of the answers you gave me is not a number. You forfeit.';
    return handlerInput.responseBuilder
      .speak(speechText)
      .withSimpleCard('Guess the Sum', speechText)
      .getResponse();
  }

  // TODO re-ask when given numbers are out of bounds


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
    .withSimpleCard('Guess the Sum', speechText)
    .getResponse();
};

const verifySlots = (handlerInput) => {
  const { intent } = handlerInput.requestEnvelope.request;
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
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
