/**
 * Created by arkadiuszputko on 16/04/16.
 */
'use strict';

var AuthbeeApi = (function () {
  var _access_token = null;
  var _apiUri = null;
  var _appId = null;

  function createCookie(name,value,days) {
    if (days) {
      var date = new Date();
      date.setTime(date.getTime()+(days*24*60*60*1000));
      var expires = "; expires="+date.toGMTString();
    }
    else var expires = "";
    document.cookie = name+"="+JSON.stringify(value)+expires+"; path=/";
  }

  function readCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
      var c = ca[i];
      while (c.charAt(0)==' ') c = c.substring(1,c.length);
      if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
  }

  function eraseCookie(name) {
    createCookie(name,"",-1);
  }

  function makeRequest(method,url,data) {
    var data = data || '';
    // Return a new promise.
    return new Promise(function(resolve, reject) {
      var req = new XMLHttpRequest();

      req.open(method, url);
      req.responseType = 'json';
      req.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
      if (_access_token) {
        req.setRequestHeader('Authorization', _access_token);
      }

      req.onload = function() {
        if (req.status == 200) {
          resolve(req.response);
        }
        else {
          reject(Error(req.statusText));
        }
      };
      req.onerror = function() {
        reject(Error("Something went wrong ... "));
      };
      req.send(data);
    });
  }

  var Constr = function() {};

  var getAppData = function() {
    return makeRequest('GET', _apiUri + '/fb/' + _appId + '/url');
  };
  var facebookLogin = function (params) {
    return new Promise(function (resolve, reject) {
      var uri = 'https://www.facebook.com/dialog/oauth?display=popup&client_id=' + params.appId +
        '&redirect_uri='+ encodeURIComponent(params.facebookCallbackUrl) +
        '&response_type=code&scope=' + params.permissions.join(',');
      var facebookPopup = window.open(uri, 'signIn', 'width=780,height=410,toolbar=0,scrollbars=0,status=0,resizable=0,location=0,menuBar=0');
      var eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
      var eventer = window[eventMethod];
      var messageEvent = eventMethod == "attachEvent" ? "onmessage" : "message";
      eventer(messageEvent,function(e) {
        facebookPopup.close();
        resolve(e.data);
      }, false);
    });
  };

  Constr.prototype = {
    constructor: AuthbeeApi
  };

  Constr.prototype.setAppId = function (appId) {
    _appId = appId;
  };

  Constr.prototype.setApiUri = function (apiUri) {
    _apiUri = apiUri;
  };

  Constr.prototype.me = function () {
    return makeRequest('GET', _apiUri + '/cs/me')
  };

  Constr.prototype.login = function () {
    window.open('', 'signIn', 'width=780,height=410,toolbar=0,scrollbars=0,status=0,resizable=0,location=0,menuBar=0');
    return getAppData().then(
      function(data) {
        return facebookLogin(data).then(
          function (data) {
            _access_token = data.appId + ' ' + data.token;
            createCookie('appId', data.appId);
            createCookie('token', data.token);
            return new Promise(
              function (resolve) {
                debugger;
                resolve(data);
              });
          },
          function (err) {
            return new Promise(
              function (resolve, reject) {
                reject(err);
              });
          }
        );
      });
  };

  Constr.prototype.logout = function () {
    return new Promise(function (resolve, reject) {
      eraseCookie('token');
      eraseCookie('appId');
      eraseCookie('group');
      var req = new XMLHttpRequest();
      req.setRequestHeader("Authorization", "");
      resolve('Successfully logout');
    });
  };
  Constr.prototype.getCurrentGroup = function () {
    return new Promise(function (resolve, reject) {
      if (readCookie('group')) {
        resolve(readCookie('group'));
      } else {
        reject('There is no set group');
      }
    });
  };

  Constr.prototype.getFbGroups = function () {
    return makeRequest('GET', _apiUri + '/cs/fb/groups');
  };

  Constr.prototype.getFbGroup = function (id) {
    return makeRequest('GET', _apiUri + '/cs/fb/groups/' + id);
  };
  Constr.prototype.setFbGroup = function (group) {
    return new Promise(function (resolve, reject) {
      makeRequest('POST', _apiUri + '/cs/fb/groups', group).then(
        function (data) {
          createCookie('group', data.id);
          resolve(data);
        },
        function (err) {
          reject(err);
        }
      )
    });
  };
  Constr.prototype.getGroups = function () {
    return makeRequest('GET', _apiUri + '/cs/groups/');
  };
  Constr.prototype.getGroup = function (id) {
    return makeRequest('GET', _apiUri + '/cs/groups/' + id);
  };
  Constr.prototype.setGroup = function (id) {
    return new Promise(function (resolve) {
      createCookie('group', id);
      resolve(data);
    });
  };
  Constr.prototype.getGroupMembers = function (id) {
    if (!id) {
      id = readCookie('group');
    }
    return new Promise(function (resolve, reject) {
      makeRequest('GET', _apiUri + '/cs/groups/' + id).then(
        function (data) {
          resolve(data.members);
        },
        function (err) {
          reject(err);
        }
      );
    });
  };
  Constr.prototype.notifyGroup = function (message, id) {
    if (!id) {
      id = readCookie('group');
    }
    return new Promise(function (resolve, reject) {
      makeRequest('POST', '/cs/fb/groups/' + id + '/feed', message).then(
        function (data) {
          resolve(data);
        },
        function (err) {
          reject(err);
        }
      );
    });

  };
  

  return Constr;
})();

