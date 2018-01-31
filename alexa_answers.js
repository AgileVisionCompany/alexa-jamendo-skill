module.exports = Object.freeze({
  WELCOME_OUTPUT: "Welcome to the Jamendo Player",
  HELP_OUTPUT:
    "You can ask me to play a song, album or an artist. Just tell me \"Play something\" if you are not sure what you'd like to listen to.",
  WELCOME_REPROMPT: "I am waiting your command",
  JAMEDO_ERROR_RESPONSE: "I was not able to get the information from the Jamendo service. Please try again",
  EMPTY_JAMENDO_RESPONSE: "I was not able to find anything like that in the Jamendo!",
  ERROR_CALL_JAMENDO_API:
    "Failed to contact the Jamendo service. Please try again later",
  FIND_NAME_ERROR: "I'm not sure what you say. Please try again.",
  FIND_SOMETHING_OUTPUT: (trackCount, currentTrackName, artist, album) => {
    return (
      "I added " +
      trackCount +
      " songs to your playlist. " +
      "Let's start with " +
      currentTrackName +
      ", by " +
      artist +
      (album ? ", album " + album : "")
    );
  },
  END_SESSION: "Thank you for trying the Jamendo Player. Have a nice day!",
  WELCOME_CARD: "Welcome",
  HELP_CARD: "Help",
  FIND_TRACK_BY_NAME_CARD: "Find song by name",
  FIND_ALBUM_BY_NAME_CARD: "Find album by name",
  FIND_ARTIST_BY_NAME_CARD: "Find artist by name",
  FIND_SOMETHING_BY_NAME_CARD: "Find something by name",
  END_SESSION_CARD: "Session Ended"
});
