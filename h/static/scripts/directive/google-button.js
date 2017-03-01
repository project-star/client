'use strict';

var angular = require('angular');

// @ngInject
function Controller($scope, $timeout, flash, session, formRespond, serviceUrl, googleAuth, annotationUI) {
  var pendingTimeout = null;
  var access_token = null;
  var img_url = null;
  var googleauthenticated = false;
 
  function success(data) {
    console.log(data)
    if (data.userid) {
//      gapi.client.load('plus','v1', function(){
//                  var request = gapi.client.plus.people.get({
//                  'userId': 'me'
//                  });
//                  request.execute(function(resp) {
//                  console.log(resp)
//                  img_url = resp.image.url;
//                  annotationUI.setUserImage(resp.image.url)
//                  console.log(resp.emails)
//                  console.log('Retrieved profile for:' + resp.displayName);
//       });
//});
      $scope.$emit('auth', null, data);
    }

    angular.copy({}, $scope.model);

    if ($scope.form) {
      $scope.form.$setPristine();
    }
  }

  function failure(form, response) {
    var errors;
    var reason;

    try {
      errors = response.data.errors;
      reason = response.data.reason;
    } catch (e) {
      reason = 'Oops, something went wrong on the server. ' +
        'Please try again later!';
    }

    return formRespond(form, errors, reason);
  }

  function timeout() {
    angular.copy({}, $scope.model);

    if ($scope.form) {
      $scope.form.$setPristine();
    }

    flash.info('For your security, ' +
               'the forms have been reset due to inactivity.');
  }

  function cancelTimeout() {
    if (!pendingTimeout) {
      return;
    }
    $timeout.cancel(pendingTimeout);
    pendingTimeout = null;
  }

  this.serviceUrl = serviceUrl;

this.submit = function submit(form) {
    console.log(form)
    gapi.auth.authorize(
                {
                        client_id: '947422137587-h3h5620i7tirkdf2nr9e6023e88f2oet.apps.googleusercontent.com',
                        interactive: true,
                        authuser: -1,
                        scope: ['https://www.googleapis.com/auth/plus.login','https://www.googleapis.com/auth/userinfo.email','https://www.googleapis.com/auth/userinfo.profile']
                },
                function(token){
                  access_token = token.access_token
                  console.log(token)
                  formRespond(form);
    console.log (form)
    if (!form.$valid) {
      return;
    }

    $scope.$broadcast('formState', form.$name, 'loading');
    console.log($scope.model)
    $scope.model.access_token = access_token;
    console.log($scope.model)
    var handler = session[form.$name];
    var _failure = angular.bind(this, failure, form);
    var res = handler($scope.model, success, _failure);
    res.$promise.finally(function() {
      return $scope.$broadcast('formState', form.$name, '');
    });
    });

  };
  if (!$scope.model) {
    $scope.model = {};
  }

  // Stop the inactivity timeout when the scope is destroyed.
  var removeDestroyHandler = $scope.$on('$destroy', function () {
    cancelTimeout(pendingTimeout);
    $scope.$emit('auth', 'cancel');
  });

  // Skip the cancel when destroying the scope after a successful auth.
  $scope.$on('auth', removeDestroyHandler);

  // Reset the auth forms afterfive minutes of inactivity.
  $scope.$watchCollection('model', function(value) {
    cancelTimeout(pendingTimeout);
    if (value && !angular.equals(value, {})) {
      pendingTimeout = $timeout(timeout, 300000);
    }
  });
}

module.exports = {
  directive: function () {
    return {
      bindToController: true,
      controller: Controller,
      controllerAs: 'vm',
      restrict: 'E',
      scope: {
        onClose: '&',
      },
      template: require('../../../templates/client/google_button.html'),
    };
  },
  Controller: Controller,
};
