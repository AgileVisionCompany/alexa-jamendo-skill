"use strict";
const constants = require("./alexa_answers");
const PlayList = require("./utils/play_list");
const axios = require("axios");
const API_URL = "https://api.jamendo.com";
const RED_URL = "https://agilevision.io/JamendoPlayer/";


// Don't forget to populate the corresponding environment variable!
const JAMENDO_CLIENT_ID = process.env.JAMENDO_CLIENT_ID;


let playList;

function buildResponse(sessionAttributes, speechletResponse) {
  return {
    version: "1.0",
    sessionAttributes,
    response: speechletResponse
  };
}

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
  return {
    outputSpeech: {
      type: "PlainText",
      text: output
    },
    card: {
      type: "Simple",
      title: `SessionSpeechlet - ${title}`,
      content: `SessionSpeechlet - ${output}`
    },
    reprompt: {
      outputSpeech: {
        type: "PlainText",
        text: repromptText
      }
    },
    shouldEndSession
  };
}

function buildSpeechletAndMusicResponse(
  title,
  output,
  shouldEndSession,
  actionType,
  track,
  behavior
) {
  return {
    outputSpeech:
      title && output
        ? {
            type: "PlainText",
            text: output
          }
        : null,
    card:
      title && output
        ? {
            type: "Simple",
            title: `SessionSpeechlet - ${title}`,
            content: `SessionSpeechlet - ${output}`
          }
        : null,
    directives: [
      {
        type: "AudioPlayer." + actionType,
        playBehavior: behavior ? behavior : null,
        clearBehavior: actionType === "ClearQueue" ? "CLEAR_ALL" : null,
        audioItem:
          actionType === "Play"
            ? {
                stream: {
                  token: track.id,
                  expectedPreviousToken:
                    actionType === "Play" && behavior === "ENQUEUE"
                      ? playList ? playList.getPrevTrack().id : null
                      : null,
                  url: track.audio,
                  offsetInMilliseconds: 0
                }
              }
            : null
      }
    ],
    shouldEndSession
  };
}

function buildOnlyMusicResponse(shouldEndSession, actionType, track, behavior) {
  return {
    directives: [
      {
        type: "AudioPlayer." + actionType,
        playBehavior: behavior ? behavior : null,
        clearBehavior: actionType === "ClearQueue" ? "CLEAR_ALL" : null,
        audioItem:
          actionType === "Play"
            ? {
                stream: {
                  token: track.id,
                  expectedPreviousToken:
                    actionType === "Play" && behavior === "ENQUEUE"
                      ? playList ? playList.getPrevTrack().id : null
                      : null,
                  url: track.audio,
                  offsetInMilliseconds: 0
                }
              }
            : null
      }
    ],
    shouldEndSession
  };
}

function getWelcomeResponse(callback) {
  callback(
    {},
    buildSpeechletResponse(
      constants.WELCOME_CARD,
      constants.WELCOME_OUTPUT,
      constants.WELCOME_REPROMPT,
      false
    )
  );
}
function getHelpResponse(callback) {
  callback(
    {},
    buildSpeechletResponse(
      constants.HELP_CARD,
      constants.HELP_OUTPUT,
      constants.WELCOME_REPROMPT,
      false
    )
  );
}
function callJamendoAndAddToPlayList(url, callback) {
  return new Promise((resolve, reject) => {
    axios
      .get(url)
      .then(function(response) {
        let speechOutput = "";
        if (
          response.data.headers.status === "success" &&
          response.data.results.length != 0
        ) {
          let trackList = [];
          response.data.results.map(track => {
            trackList[trackList.length] = {
              id: track.id,
              name: track.name,
              artist_name: track.artist_name,
              album_name: track.album_name,
              audio: track.audio
            };
          });
          playList = new PlayList(trackList, 0);
          resolve("true");
        } else {
          if (response.data.headers.status !== "success") {
            speechOutput = constants.JAMEDO_ERROR_RESPONSE;
          } else if (response.data.results.length == 0) {
            speechOutput = constants.EMPTY_JAMENDO_RESPONSE;
          }
          resolve(speechOutput);
        }
      })
      .catch(function(error) {
        resolve(constants.ERROR_CALL_JAMENDO_API);
      });
  });
}
function findTrackByName(intent, session, callback) {
  const trackNameField = intent.slots.trackName;
  const shouldEndSession = false;

  if (trackNameField && trackNameField.value) {
    const trackName = trackNameField.value;
    callJamendoAndAddToPlayList(
      API_URL +
        `/v3.0/tracks?client_id=${JAMENDO_CLIENT_ID}=json&limit=1&namesearch=` +
        trackName +
        "&audioformat=mp32",
      callback
    ).then(function(result) {
      let speechOutput = "";
      if (result === "true") {
        callback(
          {},
          buildOnlyMusicResponse(
            true,
            "Play",
            playList.getCurrentTrack(),
            "REPLACE_ALL"
          )
        );
      } else {
        callback(
          {},
          buildSpeechletResponse(
            constants.FIND_TRACK_BY_NAME_CARD,
            result,
            null,
            shouldEndSession
          )
        );
      }
    });
  } else {
    callback(
      {},
      buildSpeechletResponse(
        constants.FIND_TRACK_BY_NAME_CARD,
        constants.FIND_NAME_ERROR,
        null,
        shouldEndSession
      )
    );
  }
}
function findAlbumByName(intent, session, callback) {
  const trackNameField = intent.slots.albumName;
  const shouldEndSession = false;

  if (trackNameField && trackNameField.value) {
    const albumName = trackNameField.value;
    callJamendoAndAddToPlayList(
      API_URL +
        `/v3.0/tracks?client_id=${JAMENDO_CLIENT_ID}&format=json&limit=50&album_name=` +
        albumName +
        "&audioformat=mp32",
      callback
    ).then(function(result) {
      if (result === "true") {
        callback(
          {},
          buildOnlyMusicResponse(
            true,
            "Play",
            playList.getCurrentTrack(),
            "REPLACE_ALL"
          )
        );
      } else {
        callback(
          {},
          buildSpeechletResponse(
            constants.FIND_ALBUM_BY_NAME_CARD,
            result,
            null,
            shouldEndSession
          )
        );
      }
    });
  } else {
    callback(
      {},
      buildSpeechletResponse(
        constants.FIND_ALBUM_BY_NAME_CARD,
        constants.FIND_NAME_ERROR,
        null,
        shouldEndSession
      )
    );
  }
}
function findArtistByName(intent, session, callback) {
  const trackNameField = intent.slots.artistName;
  const shouldEndSession = false;

  if (trackNameField && trackNameField.value) {
    const artistName = trackNameField.value;
    callJamendoAndAddToPlayList(
      API_URL +
        `/v3.0/tracks?client_id=${JAMENDO_CLIENT_ID}&format=json&limit=50&artist_name=` +
        artistName +
        "&audioformat=mp32",
      callback
    ).then(function(result) {
      if (result === "true") {
        callback(
          {},
          buildOnlyMusicResponse(
            true,
            "Play",
            playList.getCurrentTrack(),
            "REPLACE_ALL"
          )
        );
      } else {
        callback(
          {},
          buildSpeechletResponse(
            constants.FIND_ARTIST_BY_NAME_CARD,
            result,
            null,
            shouldEndSession
          )
        );
      }
    });
  } else {
    callback(
      {},
      buildSpeechletResponse(
        constants.FIND_ARTIST_BY_NAME_CARD,
        constants.FIND_NAME_ERROR,
        null,
        shouldEndSession
      )
    );
  }
}

function findsomethingByName(intent, session, callback) {
  const trackNameField = intent.slots.somethingName;
  const shouldEndSession = false;
  let speechOutput = "";

  if (trackNameField && trackNameField.value) {
    const somethingName = trackNameField.value;
    axios
      .get(
        API_URL +
          `/v3.0/autocomplete?client_id=${JAMENDO_CLIENT_ID}&format=json&limit=50&prefix=` +
          somethingName +
          "&audioformat=mp32"
      )
      .then(response => {
        let unit = "namesearch=";
        if (response.data.results) {
          if (
            response.data.results.tracks &&
            response.data.results.tracks.length != 0
          )
            unit = "namesearch=";
          else if (
            response.data.results.albums &&
            response.data.results.albums.length != 0
          )
            unit = "album_name=";
          else
            response.data.results.artists &&
              response.data.results.artists.length != 0;
          unit = "artist_name=";
        }
        callJamendoAndAddToPlayList(
          API_URL +
            `/v3.0/tracks?client_id=${JAMENDO_CLIENT_ID}&format=json&limit=50&` +
            unit +
            somethingName +
            "&audioformat=mp32",
          callback
        ).then(function(result) {
          speechOutput = constants.FIND_SOMETHING_OUTPUT(
            playList.getTracksCount(),
            playList.getCurrentTrack().name,
            playList.getCurrentTrack().artist_name,
            playList.getCurrentTrack().album_name
          );
          if (result === "true") {
            callback(
              {},
              buildSpeechletAndMusicResponse(
                constants.FIND_SOMETHING_BY_NAME_CARD,
                speechOutput,
                true,
                "Play",
                playList.getCurrentTrack(),
                "REPLACE_ALL"
              )
            );
          } else {
            callback(
              {},
              buildSpeechletResponse(
                constants.FIND_SOMETHING_BY_NAME_CARD,
                result,
                null,
                shouldEndSession
              )
            );
          }
        });
      })
      .catch(error => {
        callback(
          {},
          buildSpeechletResponse(
            constants.FIND_SOMETHING_BY_NAME_CARD,
            constants.ERROR_CALL_JAMENDO_API,
            null,
            shouldEndSession
          )
        );
      });
  } else {
    callback(
      {},
      buildSpeechletResponse(
        constants.FIND_SOMETHING_BY_NAME_CARD,
        constants.FIND_NAME_ERROR,
        null,
        shouldEndSession
      )
    );
  }
}

function handleSessionEndRequest(callback) {
  callback(
    {},
    buildSpeechletResponse(
      constants.END_SESSION_CARD,
      null,
      constants.END_SESSION,
      true
    )
  );
}

function NextTrack(intent, session, callback) {
  if (playList.nextTrack()) {
    callback(
      {},
      buildOnlyMusicResponse(
        true,
        "Play",
        playList.getCurrentTrack(),
        "REPLACE_ALL"
      )
    );
  } else {
    callback({}, buildOnlyMusicResponse(true, "Stop", null));
  }
}
function PrevTrack(intent, session, callback) {
  playList.prevTrack();
  callback(
    {},
    buildOnlyMusicResponse(
      true,
      "Play",
      playList.getCurrentTrack(),
      "REPLACE_ALL"
    )
  );
}
function StopMusic(intent, session, callback) {
  const shouldEndSession = true;
  callback({}, buildOnlyMusicResponse(shouldEndSession, "Stop", null));
}
function PauseMusic(intent, session, callback) {
  const shouldEndSession = true;
  callback({}, buildOnlyMusicResponse(shouldEndSession, "Stop", null));
}
function ResumeMusic(intent, session, callback) {
  const shouldEndSession = true;
  callback(
    {},
    buildOnlyMusicResponse(
      shouldEndSession,
      "Play",
      playList.getCurrentTrack(),
      "REPLACE_ENQUEUED"
    )
  );
}

// --------------- Events -----------------------

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
  console.log(
    `onSessionStarted requestId=${sessionStartedRequest.requestId}, sessionId=${
      session.sessionId
    }`
  );
}

/**
 * Called when the user launches the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
  console.log(
    `onLaunch requestId=${launchRequest.requestId}, sessionId=${
      session.sessionId
    }`
  );

  // Dispatch to your skill's launch.
  getWelcomeResponse(callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
  console.log(
    `onIntent requestId=${intentRequest.requestId}, sessionId=${
      session.sessionId
    }`
  );

  const intent = intentRequest.intent;
  const intentName = intentRequest.intent.name;

  // Dispatch to your skill's intent handlers
  if (intentName === "FindTrackByName") {
    findTrackByName(intent, session, callback);
  } else if (intentName === "FindAlbumByName") {
    findAlbumByName(intent, session, callback);
  } else if (intentName === "FindArtistByName") {
    findArtistByName(intent, session, callback);
  } else if (intentName === "FindSomethingByName") {
    findsomethingByName(intent, session, callback);
  } else if (intentName === "AMAZON.PauseIntent") {
    PauseMusic(intent, session, callback);
  } else if (intentName === "AMAZON.ResumeIntent") {
    ResumeMusic(intent, session, callback);
  } else if (intentName === "AMAZON.HelpIntent") {
    getHelpResponse(callback);
  } else if (
    intentName === "AMAZON.StopIntent" ||
    intentName === "AMAZON.CancelIntent"
  ) {
    handleSessionEndRequest(callback);
  } else if (intentName === "AMAZON.NextIntent") {
    NextTrack(intent, session, callback);
  } else if (intentName === "AMAZON.PreviousIntent") {
    PrevTrack(intent, session, callback);
  } else {
    callback(
      {},
      buildSpeechletResponse("Error", constants.FIND_NAME_ERROR, "", false)
    );
  }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
  console.log(
    `onSessionEnded requestId=${sessionEndedRequest.requestId}, sessionId=${
      session.sessionId
    }`
  );
  // Add cleanup logic here
}
exports.handler = (event, context, callback) => {
  if (!event || !event.request) return;
  try {

    if (event.request.type === "LaunchRequest") {
      onLaunch(
        event.request,
        event.session,
        (sessionAttributes, speechletResponse) => {
          callback(null, buildResponse(sessionAttributes, speechletResponse));
        }
      );
    } else if (event.request.type === "IntentRequest") {
      onIntent(
        event.request,
        event.session,
        (sessionAttributes, speechletResponse) => {
          callback(null, buildResponse(sessionAttributes, speechletResponse));
        }
      );
    } else if (event.request.type === "AudioPlayer.PlaybackNearlyFinished") {
      NextTrack(
        event.request,
        event.session,
        (sessionAttributes, speechletResponse) => {
          callback(null, buildResponse(sessionAttributes, speechletResponse));
        }
      );
    } else if (event.request.type === "SessionEndedRequest") {
      onSessionEnded(event.request, event.session);
      callback();
    }
  } catch (err) {
    callback(err);
  }
};
