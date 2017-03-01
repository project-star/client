'use strict';

/**
 * Parses H account names of the form 'acct:<username>@<provider>'
 * into a {username, provider} object or null if the input does not
 * match the expected form.
 */
function parseAccountID(user) {
  if (!user) {
    return null;
  }
  var match = user.match(/^acct:([^@]+)@(.+)/);
  if (!match) {
    return null;
  }
  return {
    username: match[1],
    provider: match[2],
  };
}

function parseAllData(data) {
  console.log(data)
  if (!data.userid) {
    return null;
  }
  if (data.img_url) {
    return {
    img_url: data.img_url,
    authenticated: data.authenticated,
  } 
  }
  else {
  return {
    img_url: null,
    authenticated: 'renoted',
  }
  };
}

/**
 * Returns the username part of an account ID or an empty string.
 */
function username(user) {
  var account = parseAccountID(user);
  if (!account) {
    return '';
  }
  return account.username;
}

module.exports = {
  parseAccountID: parseAccountID,
  parseAllData: parseAllData,
  username: username,
};
