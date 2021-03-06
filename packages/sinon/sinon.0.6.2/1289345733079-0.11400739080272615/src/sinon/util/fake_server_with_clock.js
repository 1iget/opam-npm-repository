/**
 * @depend fake_server.js
 * @depend fake_timers.js
 */
/*jslint indent: 2, browser: true, eqeqeq: false, onevar: false*/
/*global sinon*/
/**
 * Add-on for sinon.fakeServer that automatically handles a fake timer along with
 * the FakeXMLHttpRequest. The direct inspiration for this add-on is jQuery
 * 1.3.x, which does not use xhr object's onreadystatehandler at all - instead,
 * it polls the object for completion with setInterval. Dispite the direct
 * motivation, there is nothing jQuery-specific in this file, so it can be used
 * in any environment where the ajax implementation depends on setInterval or
 * setTimeout.
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010 Christian Johansen
 */

(function () {
  function Server() {}
  Server.prototype = sinon.fakeServer;

  sinon.fakeServerWithClock = new Server();

  sinon.fakeServerWithClock.addRequest = function addRequest(xhr) {
    if (xhr.async) {
      if (typeof setTimeout.clock == "object") {
        this.clock = setTimeout.clock;
      } else {
        this.clock = sinon.useFakeTimers();
        this.resetClock = true;
      }

      if (!this.longestTimeout) {
        var clockSetTimeout = this.clock.setTimeout;
        var clockSetInterval = this.clock.setInterval;
        var server = this;

        this.clock.setTimeout = function (fn, timeout) {
          server.longestTimeout = Math.max(timeout, server.longestTimeout || 0);

          return clockSetTimeout.apply(this, arguments);
        };

        this.clock.setInterval = function (fn, timeout) {
          server.longestTimeout = Math.max(timeout, server.longestTimeout || 0);

          return clockSetInterval.apply(this, arguments);
        };
      }
    }

    return sinon.fakeServer.addRequest.call(this, xhr);
  };

  sinon.fakeServerWithClock.respond = function respond() {
    var returnVal = sinon.fakeServer.respond.apply(this, arguments);

    if (this.clock) {
      this.clock.tick(this.longestTimeout);
      this.longestTimeout = 0;

      if (this.resetClock) {
        this.clock.restore();
        this.resetClock = false;
      }
    }

    return returnVal;
  };

  sinon.fakeServerWithClock.restore = function restore() {
    if (this.clock) {
      this.clock.restore();
    }

    return sinon.fakeServer.restore.apply(this, arguments);
  };
}());
