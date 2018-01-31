"use strict";
class PlayList {
  constructor(trackArray, currentTrackNum) {
    this.trackArray = JSON.parse(JSON.stringify(trackArray));
    this.currentTrackNum = currentTrackNum;
  }
  nextTrack() {
    if (this.currentTrackNum + 1 < this.trackArray.length) {
      this.currentTrackNum++;
      return true;
    } else return false;
  }
  prevTrack() {
    if (this.currentTrackNum - 1 >= 0) {
      this.currentTrackNum--;
      return true;
    } else return false;
  }
  getCurrentTrack() {
    return this.trackArray[this.currentTrackNum];
  }
  getPrevTrack() {
    if (this.currentTrackNum - 1 >= 0) {
      return this.trackArray[this.currentTrackNum - 1];
    }
    return this.trackArray[this.currentTrackNum];
  }
  getTracksCount() {
    return this.trackArray.length;
  }
}
module.exports = PlayList;
